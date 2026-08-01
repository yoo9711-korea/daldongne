"use server";

import { auth } from "@/auth";
import { recordBookOrderAudit } from "@/lib/order-audit";
import {
  calculatePaymentAmounts,
  createPaymentEventKey,
  recordPaymentEvent,
} from "@/lib/payment-ledger";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type TossPaymentResponse = {
  paymentKey?: unknown;
  orderId?: unknown;
  status?: unknown;
  method?: unknown;
  approvedAt?: unknown;
  totalAmount?: unknown;
  balanceAmount?: unknown;
  lastTransactionKey?: unknown;
};

type TossErrorResponse = {
  code?: unknown;
  message?: unknown;
};

export async function syncOrderPayment(
  formData: FormData,
) {
  const orderRecordId = cleanText(
    formData.get("orderRecordId"),
  );

  if (!orderRecordId) {
    redirectWithResult(
      "",
      "error",
      "주문 정보를 찾을 수 없습니다.",
    );
  }

  let successMessage = "";

  try {
    const admin = await requireAdmin();

    const order =
      await prisma.bookOrder.findUnique({
        where: {
          id: orderRecordId,
        },
        select: {
          id: true,
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
        },
      });

    if (!order) {
      redirectWithResult(
        orderRecordId,
        "error",
        "주문을 찾을 수 없습니다.",
      );
    }

    const secretKey =
      process.env.TOSS_SECRET_KEY;

    if (!secretKey) {
      throw new Error(
        "토스 결제 비밀키가 설정되지 않았습니다.",
      );
    }

    const lookupPath = order.paymentKey
      ? `/v1/payments/${encodeURIComponent(
          order.paymentKey,
        )}`
      : `/v1/payments/orders/${encodeURIComponent(
          order.orderId,
        )}`;

    const response = await fetch(
      `https://api.tosspayments.com${lookupPath}`,
      {
        method: "GET",
        headers: {
          Authorization:
            createBasicAuthorization(
              secretKey,
            ),
        },
        cache: "no-store",
      },
    );

    const responseBody =
      (await response
        .json()
        .catch(() => null)) as
        | TossPaymentResponse
        | TossErrorResponse
        | null;

    if (!response.ok) {
      const tossError =
        responseBody as
          | TossErrorResponse
          | null;

      throw new Error(
        cleanText(tossError?.message) ||
          "토스 결제정보를 조회하지 못했습니다.",
      );
    }

    const payment =
      responseBody as
        | TossPaymentResponse
        | null;

    const verifiedOrderId =
      cleanText(payment?.orderId);

    const verifiedPaymentKey =
      cleanText(payment?.paymentKey);

    const verifiedStatus =
      cleanText(payment?.status);

    const verifiedMethod =
      cleanText(payment?.method);

    const verifiedAmount =
      toInteger(payment?.totalAmount);

    const verifiedBalanceAmount =
      toInteger(payment?.balanceAmount);

    const verifiedTransactionKey =
      cleanText(
        payment?.lastTransactionKey,
      );

    if (
      verifiedOrderId !== order.orderId
    ) {
      throw new Error(
        "조회된 토스 주문번호가 저장된 주문번호와 일치하지 않습니다.",
      );
    }

    if (
      verifiedAmount === null ||
      verifiedAmount !== order.totalAmount
    ) {
      throw new Error(
        "조회된 토스 결제금액이 저장된 주문금액과 일치하지 않습니다.",
      );
    }

    const nextStatus =
      mapTossStatus(
        verifiedStatus,
        order.status,
      );

    if (!nextStatus) {
      throw new Error(
        `처리할 수 없는 토스 결제상태입니다: ${
          verifiedStatus || "상태 없음"
        }`,
      );
    }

    const paymentAmounts =
      calculatePaymentAmounts({
        totalAmount:
          order.totalAmount,
        tossStatus:
          verifiedStatus,
        balanceAmount:
          verifiedBalanceAmount,
      });

    const now = new Date();

    const nextPaidAt =
      nextStatus === "PAID"
        ? parseDate(payment?.approvedAt) ||
          order.paidAt ||
          now
        : order.paidAt;

    const nextCanceledAt =
      [
        "CANCELED",
        "REFUNDED",
        "PARTIALLY_REFUNDED",
      ].includes(nextStatus)
        ? order.canceledAt || now
        : null;

    const updatedOrder =
      await prisma.bookOrder.update({
        where: {
          id: order.id,
        },
        data: {
          status: nextStatus,
          paymentKey:
            verifiedPaymentKey ||
            order.paymentKey,
          paymentMethod:
            verifiedMethod ||
            order.paymentMethod,
          paidAt: nextPaidAt,
          canceledAt:
            nextCanceledAt,
          tossStatus:
            verifiedStatus,
          approvedAmount:
            paymentAmounts.approvedAmount,
          refundedAmount:
            paymentAmounts.refundedAmount,
          balanceAmount:
            paymentAmounts.balanceAmount,
          paymentSyncedAt: now,
        },
        select: {
          id: true,
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
        },
      });

    await recordBookOrderAudit({
      orderId: order.id,
      actorId: admin.id,
      actorName: admin.name,
      actorEmail: admin.email,
      source: "ADMIN",
      category: "PAYMENT",
      action: "PAYMENT_SYNCED",
      summary:
        order.status ===
        updatedOrder.status
          ? "토스 결제정보를 다시 조회했습니다."
          : `토스 조회 결과 결제 상태를 ${order.status}에서 ${updatedOrder.status}(으)로 변경했습니다.`,
      before: order,
      after: updatedOrder,
      isCustomerVisible:
        order.status !==
        updatedOrder.status,
    });

    await recordPaymentEvent({
      orderId: order.id,
      eventType: "PAYMENT_SYNC",
      status: verifiedStatus,
      amount: 0,
      balanceAmount:
        paymentAmounts.balanceAmount,
      transactionKey:
        verifiedTransactionKey || null,
      idempotencyKey:
        createPaymentEventKey([
          "admin-sync",
          verifiedPaymentKey ||
            order.paymentKey ||
            order.orderId,
          verifiedStatus,
          paymentAmounts.balanceAmount,
          verifiedTransactionKey ||
            now.toISOString(),
        ]),
      source: "ADMIN",
      occurredAt: now,
    });

    successMessage =
      "토스 결제정보를 다시 확인해 주문 상태를 갱신했습니다.";
  } catch (error) {
    console.error(
      "[ADMIN_ORDER_PAYMENT_SYNC_ERROR]",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "결제정보 확인 중 오류가 발생했습니다.";

    redirectWithResult(
      orderRecordId,
      "error",
      message,
    );
  }

  revalidateOrderPaths(orderRecordId);

  redirectWithResult(
    orderRecordId,
    "message",
    successMessage,
  );
}

export async function cancelOrRefundOrder(
  formData: FormData,
) {
  const orderRecordId = cleanText(
    formData.get("orderRecordId"),
  );

  const cancelReason =
    cleanText(
      formData.get("cancelReason"),
    ) ||
    "관리자 요청에 의한 주문 취소";

  if (!orderRecordId) {
    redirectWithResult(
      "",
      "error",
      "주문 정보를 찾을 수 없습니다.",
    );
  }

  let successMessage = "";

  try {
    const admin = await requireAdmin();

    const order =
      await prisma.bookOrder.findUnique({
        where: {
          id: orderRecordId,
        },
        select: {
          id: true,
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
        },
      });

    if (!order) {
      redirectWithResult(
        orderRecordId,
        "error",
        "주문을 찾을 수 없습니다.",
      );
    }

    if (
      [
        "CANCELED",
        "REFUNDED",
      ].includes(order.status)
    ) {
      redirectWithResult(
        orderRecordId,
        "message",
        "이미 취소 또는 환불된 주문입니다.",
      );
    }

    if (
      order.status ===
      "PARTIALLY_REFUNDED"
    ) {
      throw new Error(
        "부분 환불된 주문은 토스 관리자센터에서 잔여 금액을 확인한 뒤 처리해 주세요.",
      );
    }

    if (!order.paymentKey) {
      const updatedOrder =
        await prisma.bookOrder.update({
          where: {
            id: order.id,
          },
          data: {
            status: "CANCELED",
            canceledAt: new Date(),
            tossStatus:
              "LOCAL_CANCELED",
            approvedAmount: 0,
            refundedAmount: 0,
            balanceAmount:
              order.totalAmount,
            paymentSyncedAt:
              new Date(),
          },
          select: {
            id: true,
            orderId: true,
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

      await recordBookOrderAudit({
        orderId: order.id,
        actorId: admin.id,
        actorName: admin.name,
        actorEmail: admin.email,
        source: "ADMIN",
        category: "REFUND",
        action: "ORDER_CANCELED",
        summary:
          `미결제 주문을 취소했습니다. 사유: ${cancelReason.slice(0, 200)}`,
        before: order,
        after: updatedOrder,
        isCustomerVisible: true,
      });

      await recordPaymentEvent({
        orderId: order.id,
        eventType:
          "ORDER_CANCELED",
        status:
          "LOCAL_CANCELED",
        amount: 0,
        balanceAmount:
          order.totalAmount,
        idempotencyKey:
          createPaymentEventKey([
            "local-cancel",
            order.id,
            cancelReason.slice(
              0,
              200,
            ),
          ]),
        reason: cancelReason,
        source: "ADMIN",
      });

      successMessage =
        "미결제 주문을 취소했습니다.";
    } else {
      const paymentMethod =
        (order.paymentMethod || "")
          .toUpperCase();

      if (
        paymentMethod.includes(
          "VIRTUAL",
        ) ||
        paymentMethod.includes(
          "가상",
        )
      ) {
        throw new Error(
          "가상계좌 환불은 고객 환불계좌 정보가 필요합니다. 토스 관리자센터에서 처리해 주세요.",
        );
      }

      const secretKey =
        process.env.TOSS_SECRET_KEY;

      if (!secretKey) {
        throw new Error(
          "토스 결제 비밀키가 설정되지 않았습니다.",
        );
      }

      const cancelIdempotencyKey =
        createPaymentEventKey([
          "admin-full-cancel",
          order.id,
          order.paymentKey,
          cancelReason.slice(
            0,
            200,
          ),
        ]);

      const response = await fetch(
        `https://api.tosspayments.com/v1/payments/${encodeURIComponent(
          order.paymentKey,
        )}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization:
              createBasicAuthorization(
                secretKey,
              ),
            "Content-Type":
              "application/json",
            "Idempotency-Key":
              cancelIdempotencyKey,
          },
          body: JSON.stringify({
            cancelReason:
              cancelReason.slice(
                0,
                200,
              ),
          }),
          cache: "no-store",
        },
      );

      const responseBody =
        (await response
          .json()
          .catch(() => null)) as
          | TossPaymentResponse
          | TossErrorResponse
          | null;

      if (!response.ok) {
        const tossError =
          responseBody as
            | TossErrorResponse
            | null;

        throw new Error(
          cleanText(
            tossError?.message,
          ) ||
            "토스 결제 취소 요청에 실패했습니다.",
        );
      }

      const canceledPayment =
        responseBody as
          | TossPaymentResponse
          | null;

      const canceledOrderId =
        cleanText(
          canceledPayment?.orderId,
        );

      const canceledStatus =
        cleanText(
          canceledPayment?.status,
        );

      const canceledTotalAmount =
        toInteger(
          canceledPayment?.totalAmount,
        );

      const canceledBalanceAmount =
        toInteger(
          canceledPayment?.balanceAmount,
        );

      const canceledTransactionKey =
        cleanText(
          canceledPayment?.lastTransactionKey,
        );

      if (
        canceledOrderId !==
          order.orderId ||
        canceledTotalAmount !==
          order.totalAmount
      ) {
        throw new Error(
          "토스 취소 결과가 저장된 주문정보와 일치하지 않습니다.",
        );
      }

      const nextStatus =
        mapTossStatus(
          canceledStatus,
          order.status,
        );

      if (
        !nextStatus ||
        ![
          "CANCELED",
          "REFUNDED",
          "PARTIALLY_REFUNDED",
        ].includes(nextStatus)
      ) {
        throw new Error(
          `토스 취소 결과 상태를 확인할 수 없습니다: ${
            canceledStatus ||
            "상태 없음"
          }`,
        );
      }

      const paymentAmounts =
        calculatePaymentAmounts({
          totalAmount:
            order.totalAmount,
          tossStatus:
            canceledStatus,
          balanceAmount:
            canceledBalanceAmount,
        });

      const paymentSyncedAt =
        new Date();

      const updatedOrder =
        await prisma.bookOrder.update({
          where: {
            id: order.id,
          },
          data: {
            status: nextStatus,
            canceledAt:
              order.canceledAt ||
              paymentSyncedAt,
            tossStatus:
              canceledStatus,
            approvedAmount:
              paymentAmounts.approvedAmount,
            refundedAmount:
              paymentAmounts.refundedAmount,
            balanceAmount:
              paymentAmounts.balanceAmount,
            paymentSyncedAt,
          },
          select: {
            id: true,
            orderId: true,
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

      await recordPaymentEvent({
        orderId: order.id,
        eventType:
          nextStatus ===
          "PARTIALLY_REFUNDED"
            ? "PARTIAL_REFUND"
            : order.paidAt
              ? "FULL_REFUND"
              : "PAYMENT_CANCELED",
        status: canceledStatus,
        amount: Math.max(
          0,
          paymentAmounts.refundedAmount -
            (order.refundedAmount || 0),
        ),
        balanceAmount:
          paymentAmounts.balanceAmount,
        transactionKey:
          canceledTransactionKey || null,
        idempotencyKey:
          cancelIdempotencyKey,
        reason: cancelReason,
        source: "ADMIN",
        occurredAt:
          paymentSyncedAt,
      });

      await recordBookOrderAudit({
        orderId: order.id,
        actorId: admin.id,
        actorName: admin.name,
        actorEmail: admin.email,
        source: "ADMIN",
        category: "REFUND",
        action:
          order.paidAt
            ? "PAYMENT_REFUNDED"
            : "PAYMENT_CANCELED",
        summary:
          `${order.paidAt ? "결제를 전액 환불" : "결제를 취소"}했습니다. 사유: ${cancelReason.slice(0, 200)}`,
        before: order,
        after: updatedOrder,
        isCustomerVisible: true,
      });

      successMessage = order.paidAt
        ? "토스 결제를 전액 환불했습니다."
        : "토스 결제를 취소했습니다.";
    }
  } catch (error) {
    console.error(
      "[ADMIN_ORDER_CANCEL_ERROR]",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "주문 취소 처리 중 오류가 발생했습니다.";

    redirectWithResult(
      orderRecordId,
      "error",
      message,
    );
  }

  revalidateOrderPaths(orderRecordId);

  redirectWithResult(
    orderRecordId,
    "message",
    successMessage,
  );
}

async function requireAdmin() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error(
      "로그인이 필요합니다.",
    );
  }

  const adminUser =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
      },
    });

  if (
    adminUser?.role !== "ADMIN"
  ) {
    throw new Error(
      "관리자만 주문 정보를 변경할 수 있습니다.",
    );
  }

  return {
    id: adminUser.id,
    name: adminUser.name,
    email: adminUser.email,
  };
}

function createBasicAuthorization(
  secretKey: string,
) {
  const encoded = Buffer.from(
    `${secretKey}:`,
    "utf8",
  ).toString("base64");

  return `Basic ${encoded}`;
}

function mapTossStatus(
  tossStatus: string,
  currentStatus: string,
) {
  if (tossStatus === "DONE") {
    return "PAID";
  }

  if (
    tossStatus ===
      "WAITING_FOR_DEPOSIT" ||
    tossStatus === "IN_PROGRESS"
  ) {
    return "PAYMENT_PENDING";
  }

  if (tossStatus === "READY") {
    return "READY";
  }

  if (
    tossStatus ===
    "PARTIAL_CANCELED"
  ) {
    return "PARTIALLY_REFUNDED";
  }

  if (tossStatus === "CANCELED") {
    return currentStatus ===
      "PAID" ||
      currentStatus ===
        "PARTIALLY_REFUNDED"
      ? "REFUNDED"
      : "CANCELED";
  }

  if (
    tossStatus === "ABORTED" ||
    tossStatus === "EXPIRED"
  ) {
    return "FAILED";
  }

  return null;
}

function cleanText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
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

function parseDate(
  value: unknown,
) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return date;
}

function revalidateOrderPaths(
  orderRecordId: string,
) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/order-audit");
  revalidatePath("/dashboard/orders");

  if (orderRecordId) {
    revalidatePath(
      `/admin/orders/${orderRecordId}`,
    );

    revalidatePath(
      `/dashboard/orders/${orderRecordId}`,
    );
  }
}

function redirectWithResult(
  orderRecordId: string,
  key: "message" | "error",
  value: string,
): never {
  const basePath = orderRecordId
    ? `/admin/orders/${orderRecordId}`
    : "/admin/orders";

  redirect(
    `${basePath}?${key}=${encodeURIComponent(
      value,
    )}`,
  );
}
// PAYMENT_LEDGER_INTEGRATION_V1
