import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";

export type PaymentLedgerSource =
  | "CUSTOMER"
  | "WEBHOOK"
  | "ADMIN"
  | "SYSTEM";

type CalculatePaymentAmountsInput = {
  totalAmount: number;
  tossStatus: string;
  balanceAmount: number | null;
};

type RecordPaymentEventInput = {
  orderId: string;
  eventType: string;
  status: string;
  amount: number;
  balanceAmount?: number | null;
  transactionKey?: string | null;
  idempotencyKey: string;
  reason?: string | null;
  source: PaymentLedgerSource;
  occurredAt?: Date | null;
};

export function createPaymentEventKey(
  parts: Array<
    string | number | null | undefined
  >,
) {
  return createHash("sha256")
    .update(
      parts
        .map((value) =>
          value === null ||
          value === undefined
            ? ""
            : String(value),
        )
        .join("|"),
      "utf8",
    )
    .digest("hex");
}

export function calculatePaymentAmounts({
  totalAmount,
  tossStatus,
  balanceAmount,
}: CalculatePaymentAmountsInput) {
  const safeTotalAmount = Math.max(
    0,
    Math.trunc(totalAmount),
  );

  const normalizedStatus =
    tossStatus.trim().toUpperCase();

  const fallbackBalance =
    normalizedStatus === "CANCELED"
      ? 0
      : safeTotalAmount;

  const safeBalanceAmount =
    balanceAmount === null
      ? fallbackBalance
      : Math.min(
          safeTotalAmount,
          Math.max(
            0,
            Math.trunc(balanceAmount),
          ),
        );

  const isApproved = [
    "DONE",
    "PARTIAL_CANCELED",
    "CANCELED",
  ].includes(normalizedStatus);

  const approvedAmount = isApproved
    ? safeTotalAmount
    : 0;

  const refundedAmount = isApproved
    ? Math.max(
        0,
        safeTotalAmount - safeBalanceAmount,
      )
    : 0;

  return {
    approvedAmount,
    refundedAmount,
    balanceAmount: safeBalanceAmount,
  };
}

export async function recordPaymentEvent({
  orderId,
  eventType,
  status,
  amount,
  balanceAmount = null,
  transactionKey = null,
  idempotencyKey,
  reason = null,
  source,
  occurredAt = null,
}: RecordPaymentEventInput) {
  const safeIdempotencyKey =
    idempotencyKey.trim().slice(0, 200);

  if (!safeIdempotencyKey) {
    console.error(
      "[PAYMENT_EVENT_IDEMPOTENCY_KEY_MISSING]",
      { orderId, eventType, status },
    );

    return false;
  }

  try {
    await prisma.bookOrderPaymentEvent.upsert({
      where: {
        idempotencyKey: safeIdempotencyKey,
      },
      update: {},
      create: {
        orderId,
        eventType:
          eventType.trim().slice(0, 100),
        status:
          status.trim().slice(0, 100),
        amount: Math.max(
          0,
          Math.trunc(amount),
        ),
        balanceAmount:
          balanceAmount === null
            ? null
            : Math.max(
                0,
                Math.trunc(balanceAmount),
              ),
        transactionKey:
          transactionKey
            ?.trim()
            .slice(0, 200) || null,
        idempotencyKey:
          safeIdempotencyKey,
        reason:
          reason?.trim().slice(0, 500) ||
          null,
        source,
        occurredAt:
          occurredAt || new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error(
      "[PAYMENT_EVENT_RECORD_ERROR]",
      {
        orderId,
        eventType,
        status,
        error,
      },
    );

    return false;
  }
}

// PAYMENT_LEDGER_INTEGRATION_V1
