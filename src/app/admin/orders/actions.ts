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
  cancels?: unknown;
};

type TossCancelResponse = {
  cancelAmount?: unknown;
  refundableAmount?: unknown;
  canceledAt?: unknown;
  transactionKey?: unknown;
  cancelReason?: unknown;
  cancelStatus?: unknown;
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
        wasPaid: Boolean(
          order.paidAt ||
          order.approvedAmount,
        ),
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
    if (isNextRedirectError(error)) {
      throw error;
    }

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

  const requestedAmountText =
    cleanText(
      formData.get("cancelAmount"),
    );

  const refundRequestKey =
    cleanText(
      formData.get("refundRequestKey"),
    );

  const refundBank = cleanText(
    formData.get("refundBank"),
  );

  const refundAccountNumber =
    cleanText(
      formData.get(
        "refundAccountNumber",
      ),
    ).replace(/\D/g, "");

  const refundHolderName =
    cleanText(
      formData.get("refundHolderName"),
    );

  if (!orderRecordId) {
    redirectWithResult(
      "",
      "error",
      "주문 정보를 찾을 수 없습니다.",
    );
  }

  if (
    !/^[A-Za-z0-9_-]{16,100}$/.test(
      refundRequestKey,
    )
  ) {
    redirectWithResult(
      orderRecordId,
      "error",
      "취소·환불 요청 식별자를 확인할 수 없습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.",
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
        "이미 취소 또는 환불이 완료된 주문입니다.",
      );
    }

    const currentRefundedAmount =
      Math.max(
        0,
        order.refundedAmount || 0,
      );

    const availableAmount =
      order.balanceAmount === null
        ? Math.max(
            0,
            order.totalAmount -
              currentRefundedAmount,
          )
        : Math.min(
            order.totalAmount,
            Math.max(
              0,
              order.balanceAmount,
            ),
          );

    const requestedCancelAmount =
      requestedAmountText
        ? toInteger(
            requestedAmountText,
          )
        : availableAmount;

    if (!order.paymentKey) {
      if (
        requestedCancelAmount === null ||
        requestedCancelAmount !==
          availableAmount
      ) {
        throw new Error(
          "미결제 주문은 부분 취소할 수 없습니다.",
        );
      }

      const paymentSyncedAt =
        new Date();

      const updatedOrder =
        await prisma.bookOrder.update({
          where: {
            id: order.id,
          },
          data: {
            status: "CANCELED",
            canceledAt:
              order.canceledAt ||
              paymentSyncedAt,
            tossStatus:
              "LOCAL_CANCELED",
            approvedAmount: 0,
            refundedAmount: 0,
            balanceAmount: 0,
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
          "ORDER_CANCELED",
        status:
          "LOCAL_CANCELED",
        amount: 0,
        balanceAmount: 0,
        idempotencyKey:
          createPaymentEventKey([
            "local-cancel-v3",
            order.id,
            refundRequestKey,
          ]),
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
        action: "ORDER_CANCELED",
        summary:
          `미결제 주문을 취소했습니다. 사유: ${cancelReason.slice(0, 200)}`,
        before: order,
        after: updatedOrder,
        isCustomerVisible: true,
      });

      successMessage =
        "미결제 주문을 취소했습니다.";
    } else {
      if (availableAmount <= 0) {
        throw new Error(
          "환불 가능한 잔액이 없습니다.",
        );
      }

      if (
        requestedCancelAmount === null ||
        requestedCancelAmount < 1 ||
        requestedCancelAmount >
          availableAmount
      ) {
        throw new Error(
          `환불 금액은 1원 이상 ${availableAmount.toLocaleString()}원 이하로 입력해 주세요.`,
        );
      }

      if (
        !order.paidAt &&
        requestedCancelAmount !==
          availableAmount
      ) {
        throw new Error(
          "입금 또는 결제 완료 전에는 부분 취소할 수 없습니다.",
        );
      }

      const isVirtualAccount =
        isVirtualAccountPayment(
          order.paymentMethod,
        );

      const needsRefundAccount =
        isVirtualAccount &&
        Boolean(order.paidAt);

      if (needsRefundAccount) {
        if (
          !refundBank ||
          !refundAccountNumber ||
          !refundHolderName
        ) {
          throw new Error(
            "가상계좌 환불은 은행 코드, 계좌번호, 예금주명을 모두 입력해야 합니다.",
          );
        }

        if (
          refundBank.length > 10 ||
          refundAccountNumber.length < 6 ||
          refundAccountNumber.length > 30 ||
          refundHolderName.length > 100
        ) {
          throw new Error(
            "가상계좌 환불계좌 정보를 다시 확인해 주세요.",
          );
        }
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
          "admin-refund-v3",
          order.id,
          order.paymentKey,
          refundRequestKey,
        ]);

      const cancelRequestBody: {
        cancelReason: string;
        cancelAmount?: number;
        refundReceiveAccount?: {
          bank: string;
          accountNumber: string;
          holderName: string;
        };
      } = {
        cancelReason:
          cancelReason.slice(
            0,
            200,
          ),
      };

      if (order.paidAt) {
        cancelRequestBody.cancelAmount =
          requestedCancelAmount;
      }

      if (needsRefundAccount) {
        cancelRequestBody.refundReceiveAccount = {
          bank: refundBank,
          accountNumber:
            refundAccountNumber,
          holderName:
            refundHolderName,
        };
      }

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
          body: JSON.stringify(
            cancelRequestBody,
          ),
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

      const latestCancel =
        getLatestTossCancel(
          canceledPayment?.cancels,
          canceledTransactionKey,
        );

      const responseCancelAmount =
        toInteger(
          latestCancel?.cancelAmount,
        );

      const responseRefundableAmount =
        toInteger(
          latestCancel?.refundableAmount,
        );

      const responseTransactionKey =
        cleanText(
          latestCancel?.transactionKey,
        ) ||
        canceledTransactionKey;

      const responseCanceledAt =
        parseDate(
          latestCancel?.canceledAt,
        );

      const paymentAmounts =
        calculatePaymentAmounts({
          totalAmount:
            order.totalAmount,
          tossStatus:
            canceledStatus,
          balanceAmount:
            canceledBalanceAmount,
          wasPaid: Boolean(
            order.paidAt ||
            order.approvedAmount,
          ),
        });

      const actualCancelAmount =
        responseCancelAmount ??
        Math.max(
          0,
          paymentAmounts.refundedAmount -
            currentRefundedAmount,
        );

      if (
        actualCancelAmount !==
          requestedCancelAmount
      ) {
        throw new Error(
          "토스에서 처리된 환불 금액이 요청 금액과 일치하지 않습니다.",
        );
      }

      if (
        responseRefundableAmount !== null &&
        responseRefundableAmount !==
          paymentAmounts.balanceAmount
      ) {
        throw new Error(
          "토스 환불 가능 잔액이 결제 잔액과 일치하지 않습니다.",
        );
      }

      const expectedRefundedAmount =
        currentRefundedAmount +
        actualCancelAmount;

      if (
        paymentAmounts.refundedAmount !==
          expectedRefundedAmount
      ) {
        throw new Error(
          "토스 누적 환불 금액이 저장된 환불 이력과 일치하지 않습니다.",
        );
      }

      const nextStatus =
        order.paidAt
          ? paymentAmounts.balanceAmount === 0
            ? "REFUNDED"
            : "PARTIALLY_REFUNDED"
          : "CANCELED";

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
              responseCanceledAt ||
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
        amount:
          actualCancelAmount,
        balanceAmount:
          paymentAmounts.balanceAmount,
        transactionKey:
          responseTransactionKey ||
          null,
        idempotencyKey:
          cancelIdempotencyKey,
        reason: cancelReason,
        source: "ADMIN",
        occurredAt:
          responseCanceledAt ||
          paymentSyncedAt,
      });

      const refundAccountAudit =
        needsRefundAccount
          ? {
              bank: refundBank,
              accountNumber:
                maskAccountNumber(
                  refundAccountNumber,
                ),
            }
          : null;

      await recordBookOrderAudit({
        orderId: order.id,
        actorId: admin.id,
        actorName: admin.name,
        actorEmail: admin.email,
        source: "ADMIN",
        category: "REFUND",
        action:
          nextStatus ===
          "PARTIALLY_REFUNDED"
            ? "PAYMENT_PARTIALLY_REFUNDED"
            : order.paidAt
              ? "PAYMENT_REFUNDED"
              : "PAYMENT_CANCELED",
        summary:
          `${actualCancelAmount.toLocaleString()}원을 ${
            nextStatus ===
            "PARTIALLY_REFUNDED"
              ? "부분 환불"
              : order.paidAt
                ? "전액 환불"
                : "취소"
          }했습니다. 사유: ${cancelReason.slice(0, 200)}`,
        before: order,
        after: {
          ...updatedOrder,
          refundAccount:
            refundAccountAudit,
        },
        isCustomerVisible: true,
      });

      successMessage =
        nextStatus ===
        "PARTIALLY_REFUNDED"
          ? `${actualCancelAmount.toLocaleString()}원을 부분 환불했습니다.`
          : order.paidAt
            ? `${actualCancelAmount.toLocaleString()}원을 전액 환불했습니다.`
            : "토스 결제를 취소했습니다.";
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

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

function isNextRedirectError(
  error: unknown,
) {
  if (
    !error ||
    typeof error !== "object" ||
    !("digest" in error)
  ) {
    return false;
  }

  const digest =
    (error as {
      digest?: unknown;
    }).digest;

  return (
    typeof digest === "string" &&
    digest.startsWith(
      "NEXT_REDIRECT",
    )
  );
}

function isVirtualAccountPayment(
  paymentMethod: string | null,
) {
  const normalized =
    (paymentMethod || "")
      .trim()
      .toUpperCase();

  return (
    normalized.includes(
      "VIRTUAL",
    ) ||
    normalized.includes(
      "가상",
    )
  );
}

function getLatestTossCancel(
  value: unknown,
  transactionKey: string,
): TossCancelResponse | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const cancelRecords = value.filter(
    (item): item is Record<
      string,
      unknown
    > =>
      Boolean(item) &&
      typeof item === "object" &&
      !Array.isArray(item),
  );

  if (transactionKey) {
    const matched =
      [...cancelRecords]
        .reverse()
        .find(
          (item) =>
            cleanText(
              item.transactionKey,
            ) === transactionKey,
        );

    if (matched) {
      return matched;
    }
  }

  return (
    cancelRecords.at(-1) || null
  );
}

function maskAccountNumber(
  accountNumber: string,
) {
  const digits = accountNumber.replace(
    /\D/g,
    "",
  );

  if (digits.length <= 4) {
    return "****";
  }

  return `****${digits.slice(-4)}`;
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

// PAYMENT_REFUND_WORKFLOW_V2
