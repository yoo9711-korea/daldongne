import { recordBookOrderAudit } from "@/lib/order-audit";
import { sendOrderPaymentCompletedEmail } from "@/lib/order-email";
import {
  calculatePaymentAmounts,
  createPaymentEventKey,
  recordPaymentEvent,
} from "@/lib/payment-ledger";
import { prisma } from "@/lib/prisma";
import { validatePaymentStatusTransition } from "@/lib/order-workflow-policy";
import { BookOrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaymentWebhookBody = {
  eventType?: unknown;
  createdAt?: unknown;
  data?: unknown;
  orderId?: unknown;
  status?: unknown;
  transactionKey?: unknown;
  secret?: unknown;
};

type TossPaymentData = {
  paymentKey?: unknown;
  orderId?: unknown;
  status?: unknown;
  method?: unknown;
  approvedAt?: unknown;
  totalAmount?: unknown;
  balanceAmount?: unknown;
  lastTransactionKey?: unknown;
};

const SUPPORTED_EVENT_TYPES = new Set([
  "PAYMENT_STATUS_CHANGED",
  "DEPOSIT_CALLBACK",
  "CANCEL_STATUS_CHANGED",
]);

export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      (await request
        .json()
        .catch(() => null)) as
        | PaymentWebhookBody
        | null;

    if (!body) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "웹훅 본문을 확인할 수 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const explicitEventType =
      cleanText(body.eventType);

    /*
     * DEPOSIT_CALLBACK 본문에는 eventType이 없을 수 있습니다.
     * top-level orderId와 status가 있으면 가상계좌 콜백으로 판별합니다.
     */
    const eventType =
      explicitEventType ||
      (cleanText(body.orderId) &&
      cleanText(body.status)
        ? "DEPOSIT_CALLBACK"
        : "");

    if (!SUPPORTED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        eventType:
          eventType || "UNKNOWN",
        message:
          "처리 대상이 아닌 웹훅입니다.",
      });
    }

    let eventOrderId = "";
    let eventPaymentKey = "";
    let eventStatus = "";
    let eventTransactionKey = "";

    if (eventType === "DEPOSIT_CALLBACK") {
      eventOrderId =
        cleanText(body.orderId);
      eventStatus =
        cleanText(body.status);
      eventTransactionKey =
        cleanText(body.transactionKey);
    } else {
      if (!isRecord(body.data)) {
        return NextResponse.json(
          {
            ok: false,
            eventType,
            message:
              "웹훅 결제정보가 없습니다.",
          },
          {
            status: 400,
          },
        );
      }

      const eventData =
        body.data as TossPaymentData;

      eventOrderId =
        cleanText(eventData.orderId);
      eventPaymentKey =
        cleanText(eventData.paymentKey);
      eventStatus =
        cleanText(eventData.status);
      eventTransactionKey =
        cleanText(
          eventData.lastTransactionKey,
        );
    }

    if (!isValidOrderId(eventOrderId)) {
      return NextResponse.json(
        {
          ok: false,
          eventType,
          message:
            "웹훅 주문번호가 올바르지 않습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      eventPaymentKey &&
      eventPaymentKey.length > 200
    ) {
      return NextResponse.json(
        {
          ok: false,
          eventType,
          message:
            "웹훅 결제키가 올바르지 않습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const order =
      await prisma.bookOrder.findUnique({
        where: {
          orderId: eventOrderId,
        },
        select: {
          id: true,
          bookId: true,
          productName: true,
          orderId: true,
          totalAmount: true,
          status: true,
          paymentKey: true,
          paymentMethod: true,
          paidAt: true,
          canceledAt: true,
          tossStatus: true,
          approvedAmount: true,
          refundedAmount: true,
          balanceAmount: true,
          paymentSyncedAt: true,
          book: {
            select: {
              title: true,
            },
          },
          productionRequest: {
            select: {
              name: true,
              email: true,
            },
          },
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

    if (!order) {
      console.warn(
        "[TOSS_WEBHOOK_ORDER_NOT_FOUND]",
        {
          eventType,
          orderId: eventOrderId,
        },
      );

      return NextResponse.json({
        ok: true,
        ignored: true,
        eventType,
        message:
          "연결된 달동네 주문이 없습니다.",
      });
    }

    if (
      order.paymentKey &&
      eventPaymentKey &&
      order.paymentKey !== eventPaymentKey
    ) {
      console.error(
        "[TOSS_WEBHOOK_PAYMENT_KEY_CONFLICT]",
        {
          eventType,
          orderId: eventOrderId,
        },
      );

      return NextResponse.json(
        {
          ok: false,
          eventType,
          message:
            "기존 결제키와 웹훅 결제키가 일치하지 않습니다.",
        },
        {
          status: 409,
        },
      );
    }

    const secretKey =
      process.env.TOSS_SECRET_KEY;

    if (!secretKey) {
      console.error(
        "[TOSS_WEBHOOK_SECRET_KEY_MISSING]",
      );

      return NextResponse.json(
        {
          ok: false,
          eventType,
          message:
            "결제 서버 설정이 없습니다.",
        },
        {
          status: 500,
        },
      );
    }

    const authorization =
      Buffer.from(
        `${secretKey}:`,
        "utf8",
      ).toString("base64");

    const lookupPaymentKey =
      eventPaymentKey ||
      order.paymentKey ||
      "";

    const lookupPath =
      lookupPaymentKey
        ? `/v1/payments/${encodeURIComponent(
            lookupPaymentKey,
          )}`
        : `/v1/payments/orders/${encodeURIComponent(
            order.orderId,
          )}`;

    let tossResponse: Response;

    try {
      tossResponse = await fetch(
        `https://api.tosspayments.com${lookupPath}`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Basic ${authorization}`,
          },
          cache: "no-store",
        },
      );
    } catch (error) {
      console.error(
        "[TOSS_WEBHOOK_PAYMENT_LOOKUP_NETWORK_ERROR]",
        {
          eventType,
          orderId: order.orderId,
          error,
        },
      );

      return NextResponse.json(
        {
          ok: false,
          eventType,
          message:
            "토스 결제정보 조회에 실패했습니다.",
        },
        {
          status: 502,
        },
      );
    }

    const tossBody =
      (await tossResponse
        .json()
        .catch(() => null)) as
        | TossPaymentData
        | null;

    if (!tossResponse.ok || !tossBody) {
      console.error(
        "[TOSS_WEBHOOK_PAYMENT_LOOKUP_REJECTED]",
        {
          eventType,
          status:
            tossResponse.status,
          orderId: order.orderId,
        },
      );

      return NextResponse.json(
        {
          ok: false,
          eventType,
          message:
            "토스 결제정보를 확인하지 못했습니다.",
        },
        {
          status: 502,
        },
      );
    }

    const verifiedPaymentKey =
      cleanText(tossBody.paymentKey);
    const verifiedOrderId =
      cleanText(tossBody.orderId);
    const verifiedTossStatus =
      cleanText(tossBody.status);
    const verifiedMethod =
      cleanText(tossBody.method);
    const verifiedAmount =
      toInteger(tossBody.totalAmount);
    const verifiedBalanceAmount =
      toInteger(tossBody.balanceAmount);
    const verifiedTransactionKey =
      cleanText(
        tossBody.lastTransactionKey,
      );

    if (
      !verifiedPaymentKey ||
      verifiedOrderId !== order.orderId ||
      (lookupPaymentKey &&
        verifiedPaymentKey !==
          lookupPaymentKey)
    ) {
      console.error(
        "[TOSS_WEBHOOK_PAYMENT_ID_MISMATCH]",
        {
          eventType,
          orderId: order.orderId,
          verifiedOrderId,
        },
      );

      return NextResponse.json(
        {
          ok: false,
          eventType,
          message:
            "조회된 결제정보가 주문과 일치하지 않습니다.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      order.paymentKey &&
      order.paymentKey !==
        verifiedPaymentKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          eventType,
          message:
            "저장된 결제키와 조회된 결제키가 일치하지 않습니다.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      verifiedAmount === null ||
      verifiedAmount !== order.totalAmount
    ) {
      console.error(
        "[TOSS_WEBHOOK_AMOUNT_MISMATCH]",
        {
          eventType,
          orderId: order.orderId,
          expectedAmount:
            order.totalAmount,
          verifiedAmount,
        },
      );

      return NextResponse.json(
        {
          ok: false,
          eventType,
          message:
            "조회된 결제금액이 주문금액과 일치하지 않습니다.",
        },
        {
          status: 409,
        },
      );
    }

    const nextStatus =
      mapBookOrderStatus(
        verifiedTossStatus,
        order.status,
      );

    if (!nextStatus) {
      console.warn(
        "[TOSS_WEBHOOK_STATUS_IGNORED]",
        {
          eventType,
          orderId: order.orderId,
          eventStatus,
          tossStatus:
            verifiedTossStatus,
        },
      );

      return NextResponse.json({
        ok: true,
        ignored: true,
        eventType,
        message:
          "변경할 필요가 없는 결제 상태입니다.",
      });
    }

    const paymentTransition =
      validatePaymentStatusTransition(
        order.status,
        nextStatus,
      );

    if (!paymentTransition.ok) {
      console.warn(
        "[TOSS_WEBHOOK_REGRESSION_IGNORED]",
        {
          eventType,
          orderId: order.orderId,
          currentStatus:
            order.status,
          nextStatus,
          message:
            paymentTransition.message,
        },
      );

      return NextResponse.json({
        ok: true,
        ignored: true,
        eventType,
        message:
          "이전 결제 상태로 되돌리는 웹훅을 무시했습니다.",
      });
    }

    const paymentAmounts =
      calculatePaymentAmounts({
        totalAmount:
          order.totalAmount,
        tossStatus:
          verifiedTossStatus,
        balanceAmount:
          verifiedBalanceAmount,
        wasPaid: Boolean(
          order.paidAt ||
          order.approvedAmount,
        ),
      });

    const paymentSyncedAt =
      new Date();

    const isPaid =
      nextStatus ===
      BookOrderStatus.PAID;

    const isRefunded =
      nextStatus ===
        BookOrderStatus.REFUNDED ||
      nextStatus ===
        BookOrderStatus
          .PARTIALLY_REFUNDED;

    const isCanceled =
      nextStatus ===
      BookOrderStatus.CANCELED;

    const paidAt = isPaid
      ? parseDate(
          tossBody.approvedAt,
        ) ||
        order.paidAt ||
        new Date()
      : isRefunded
        ? order.paidAt
        : null;

    const canceledAt =
      isRefunded || isCanceled
        ? order.canceledAt ||
          new Date()
        : null;

    const updatedOrder =
      await prisma.bookOrder.update({
        where: {
          id: order.id,
        },
        data: {
          paymentKey:
            verifiedPaymentKey,
          paymentMethod:
            verifiedMethod ||
            order.paymentMethod,
          status: nextStatus,
          paidAt,
          canceledAt,
          tossStatus:
            verifiedTossStatus,
          approvedAmount:
            paymentAmounts.approvedAmount,
          refundedAmount:
            paymentAmounts.refundedAmount,
          balanceAmount:
            paymentAmounts.balanceAmount,
          paymentSyncedAt,
        },
        select: {
          orderId: true,
          totalAmount: true,
          status: true,
          paymentMethod: true,
          paidAt: true,
          canceledAt: true,
          tossStatus: true,
          approvedAmount: true,
          refundedAmount: true,
          balanceAmount: true,
          paymentSyncedAt: true,
        },
      });

    const isRefundEvent =
      isRefunded || isCanceled;

    const eventAmount =
      isRefundEvent
        ? Math.max(
            0,
            paymentAmounts.refundedAmount -
              (order.refundedAmount || 0),
          )
        : Math.max(
            0,
            paymentAmounts.approvedAmount -
              (order.approvedAmount || 0),
          );

    const transmissionId =
      cleanText(
        request.headers.get(
          "tosspayments-webhook-transmission-id",
        ),
      );

    const webhookCreatedAt =
      parseDate(body.createdAt);

    await recordPaymentEvent({
      orderId: order.id,
      eventType:
        `WEBHOOK_${eventType}`,
      status:
        verifiedTossStatus,
      amount: eventAmount,
      balanceAmount:
        paymentAmounts.balanceAmount,
      transactionKey:
        verifiedTransactionKey ||
        eventTransactionKey ||
        null,
      idempotencyKey:
        createPaymentEventKey([
          "webhook-v3",
          transmissionId || "none",
          eventType,
          verifiedPaymentKey,
          verifiedTossStatus,
          paymentAmounts.balanceAmount,
          verifiedTransactionKey ||
            eventTransactionKey ||
            "none",
          cleanText(body.createdAt) ||
            "none",
        ]),
      reason:
        eventStatus
          ? `eventStatus=${eventStatus}`
          : null,
      source: "WEBHOOK",
      occurredAt:
        webhookCreatedAt ||
        paidAt ||
        canceledAt ||
        paymentSyncedAt,
    });

    await recordBookOrderAudit({
      orderId: order.id,
      source: "WEBHOOK",
      category:
        updatedOrder.status ===
          BookOrderStatus.REFUNDED ||
        updatedOrder.status ===
          BookOrderStatus
            .PARTIALLY_REFUNDED ||
        updatedOrder.status ===
          BookOrderStatus.CANCELED
          ? "REFUND"
          : "PAYMENT",
      action:
        `TOSS_${eventType}`,
      summary:
        order.status ===
        updatedOrder.status
          ? `토스 ${eventType} 웹훅으로 결제 상태 ${updatedOrder.status}을(를) 확인했습니다.`
          : `토스 ${eventType} 웹훅으로 결제 상태가 ${order.status}에서 ${updatedOrder.status}(으)로 변경되었습니다.`,
      before: {
        status: order.status,
        paymentMethod:
          order.paymentMethod,
        paidAt: order.paidAt,
        canceledAt:
          order.canceledAt,
        tossStatus:
          order.tossStatus,
        approvedAmount:
          order.approvedAmount,
        refundedAmount:
          order.refundedAmount,
        balanceAmount:
          order.balanceAmount,
      },
      after: {
        status:
          updatedOrder.status,
        paymentMethod:
          updatedOrder.paymentMethod,
        paidAt:
          updatedOrder.paidAt,
        canceledAt:
          updatedOrder.canceledAt,
        totalAmount:
          updatedOrder.totalAmount,
        tossStatus:
          updatedOrder.tossStatus,
        approvedAmount:
          updatedOrder.approvedAmount,
        refundedAmount:
          updatedOrder.refundedAmount,
        balanceAmount:
          updatedOrder.balanceAmount,
        paymentSyncedAt:
          updatedOrder.paymentSyncedAt,
        eventType,
        transmissionId:
          transmissionId || null,
      },
      isCustomerVisible:
        order.status !==
        updatedOrder.status,
    });

    if (
      order.status !==
        BookOrderStatus.PAID &&
      updatedOrder.status ===
        BookOrderStatus.PAID
    ) {
      await sendOrderPaymentCompletedEmail({
        to:
          order.productionRequest
            .email ||
          order.author.email ||
          null,
        customerName:
          order.productionRequest
            .name ||
          order.author.name ||
          null,
        bookTitle:
          order.book.title,
        orderRecordId:
          order.id,
        orderId:
          updatedOrder.orderId,
        productName:
          order.productName,
        totalAmount:
          updatedOrder.totalAmount,
        paymentMethod:
          updatedOrder.paymentMethod,
        paidAt:
          updatedOrder.paidAt,
      });
    }

    revalidatePath(
      "/dashboard/orders",
    );
    revalidatePath(
      `/dashboard/orders/${order.id}`,
    );
    revalidatePath(
      `/dashboard/library/${order.bookId}`,
    );
    revalidatePath(
      `/admin/orders/${order.id}`,
    );

    console.info(
      "[TOSS_WEBHOOK_ORDER_UPDATED]",
      {
        eventType,
        transmissionId:
          transmissionId || null,
        orderId:
          updatedOrder.orderId,
        tossStatus:
          verifiedTossStatus,
        bookOrderStatus:
          updatedOrder.status,
      },
    );

    return NextResponse.json({
      ok: true,
      ignored: false,
      eventType,
      orderId:
        updatedOrder.orderId,
      status:
        updatedOrder.status,
      tossStatus:
        updatedOrder.tossStatus,
      approvedAmount:
        updatedOrder.approvedAmount,
      refundedAmount:
        updatedOrder.refundedAmount,
      balanceAmount:
        updatedOrder.balanceAmount,
      paymentSyncedAt:
        updatedOrder.paymentSyncedAt,
    });
  } catch (error) {
    console.error(
      "[TOSS_PAYMENT_WEBHOOK_ERROR]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "결제 웹훅 처리 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

function mapBookOrderStatus(
  tossStatus: string,
  currentStatus: BookOrderStatus,
): BookOrderStatus | null {
  if (tossStatus === "DONE") {
    return BookOrderStatus.PAID;
  }

  if (
    tossStatus ===
      "WAITING_FOR_DEPOSIT" ||
    tossStatus === "IN_PROGRESS"
  ) {
    return BookOrderStatus
      .PAYMENT_PENDING;
  }

  if (tossStatus === "READY") {
    return BookOrderStatus.READY;
  }

  if (
    tossStatus ===
    "PARTIAL_CANCELED"
  ) {
    return BookOrderStatus
      .PARTIALLY_REFUNDED;
  }

  if (tossStatus === "CANCELED") {
    const wasPaid =
      currentStatus ===
        BookOrderStatus.PAID ||
      currentStatus ===
        BookOrderStatus
          .PARTIALLY_REFUNDED ||
      currentStatus ===
        BookOrderStatus.REFUNDED;

    return wasPaid
      ? BookOrderStatus.REFUNDED
      : BookOrderStatus.CANCELED;
  }

  if (
    tossStatus === "ABORTED" ||
    tossStatus === "EXPIRED"
  ) {
    return BookOrderStatus.FAILED;
  }

  return null;
}

function cleanText(
  value: unknown,
) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function toInteger(
  value: unknown,
) {
  if (
    typeof value === "number" &&
    Number.isSafeInteger(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    const parsed = Number(value);

    if (
      Number.isSafeInteger(parsed)
    ) {
      return parsed;
    }
  }

  return null;
}

function isValidOrderId(
  orderId: string,
) {
  return (
    orderId.length >= 6 &&
    orderId.length <= 64 &&
    /^[A-Za-z0-9_-]+$/.test(
      orderId,
    )
  );
}

function parseDate(
  value: unknown,
) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// PAYMENT_LEDGER_INTEGRATION_V1
// PAYMENT_REFUND_WORKFLOW_V2
// PAYMENT_WEBHOOK_COVERAGE_V3
