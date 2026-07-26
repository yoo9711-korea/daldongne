"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type TossPaymentResponse = {
  paymentKey?: unknown;
  orderId?: unknown;
  status?: unknown;
  method?: unknown;
  approvedAt?: unknown;
  totalAmount?: unknown;
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
    await requireAdmin();

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
      },
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
    await requireAdmin();

    const order =
      await prisma.bookOrder.findUnique({
        where: {
          id: orderRecordId,
        },
        select: {
          id: true,
          orderId: true,
          status: true,
          paymentKey: true,
          paymentMethod: true,
          paidAt: true,
          canceledAt: true,
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
      await prisma.bookOrder.update({
        where: {
          id: order.id,
        },
        data: {
          status: "CANCELED",
          canceledAt: new Date(),
        },
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
              randomUUID(),
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

      await prisma.bookOrder.update({
        where: {
          id: order.id,
        },
        data: {
          status: order.paidAt
            ? "REFUNDED"
            : "CANCELED",
          canceledAt:
            order.canceledAt ||
            new Date(),
        },
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
        role: true,
      },
    });

  if (
    adminUser?.role !== "ADMIN"
  ) {
    throw new Error(
      "관리자만 주문 정보를 변경할 수 있습니다.",
    );
  }
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

  if (orderRecordId) {
    revalidatePath(
      `/admin/orders/${orderRecordId}`,
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