import type {
  BookOrderStatus,
  BookProductionStage,
} from "@prisma/client";

export const STRICT_OPERATION_STAGES = [
  "PROOF_APPROVED",
  "PRINT_ORDERED",
  "PRINTING",
  "SHIPPING_PREPARATION",
  "SHIPPED",
  "COMPLETED",
] as const;

const EARLY_STAGE_TRANSITIONS:
  Record<string, readonly string[]> = {
    PREPARING: [
      "MANUSCRIPT_RECEIVED",
      "ON_HOLD",
    ],
    MANUSCRIPT_RECEIVED: [
      "REVIEWING",
      "ON_HOLD",
    ],
    REVIEWING: [
      "PROOFING",
      "ON_HOLD",
    ],
    PROOFING: [
      "PROOF_SENT",
      "ON_HOLD",
    ],
    PROOF_SENT: [
      "PROOFING",
      "ON_HOLD",
    ],
    ON_HOLD: [
      "PREPARING",
      "MANUSCRIPT_RECEIVED",
      "REVIEWING",
      "PROOFING",
      "PROOF_SENT",
    ],
  };

const PAYMENT_TRANSITIONS:
  Record<string, readonly string[]> = {
    READY: [
      "PAYMENT_PENDING",
      "PAID",
      "FAILED",
      "CANCELED",
    ],
    PAYMENT_PENDING: [
      "PAID",
      "FAILED",
      "CANCELED",
    ],
    FAILED: [
      "PAYMENT_PENDING",
      "PAID",
      "CANCELED",
    ],
    PAID: [
      "PARTIALLY_REFUNDED",
      "REFUNDED",
      "CANCELED",
    ],
    PARTIALLY_REFUNDED: [
      "PARTIALLY_REFUNDED",
      "REFUNDED",
      "CANCELED",
    ],
    REFUNDED: [],
    CANCELED: [],
  };

type ProductionSnapshot = {
  manuscriptReceivedAt?: unknown;
  reviewStartedAt?: unknown;
  proofFileUrl?: unknown;
  proofSentAt?: unknown;
  proofApprovedAt?: unknown;
  printOrderedAt?: unknown;
  printingCompletedAt?: unknown;
  shippingCarrier?: unknown;
  trackingNumber?: unknown;
  shippedAt?: unknown;
  completedAt?: unknown;
};

type ProductionTransitionInput = {
  currentStage:
    | BookProductionStage
    | string;
  nextStage:
    | BookProductionStage
    | string;
  orderStatus:
    | BookOrderStatus
    | string;
  snapshot: ProductionSnapshot;
};

type ValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export function validateOrderProductionTransition({
  currentStage,
  nextStage,
  orderStatus,
  snapshot,
}: ProductionTransitionInput): ValidationResult {
  const current =
    String(currentStage);

  const next =
    String(nextStage);

  const paymentStatus =
    String(orderStatus);

  if (current === next) {
    return {
      ok: true,
    };
  }

  if (
    [
      "CANCELED",
      "REFUNDED",
      "PARTIALLY_REFUNDED",
    ].includes(paymentStatus)
  ) {
    return {
      ok: false,
      message:
        "취소 또는 환불된 주문은 제작 단계를 변경할 수 없습니다.",
    };
  }

  if (
    paymentStatus !== "PAID" &&
    !(
      current === "PREPARING" &&
      next === "ON_HOLD"
    )
  ) {
    return {
      ok: false,
      message:
        "결제 완료가 확인된 주문만 제작을 진행할 수 있습니다.",
    };
  }

  if (
    STRICT_OPERATION_STAGES.includes(
      next as
        (typeof STRICT_OPERATION_STAGES)[number],
    )
  ) {
    return {
      ok: false,
      message:
        "교정 승인·인쇄·배송·완료 단계는 주문 상세의 전용 처리 버튼으로만 변경할 수 있습니다.",
    };
  }

  const allowed =
    EARLY_STAGE_TRANSITIONS[
      current
    ] || [];

  if (!allowed.includes(next)) {
    return {
      ok: false,
      message:
        `"${current}" 단계에서 "${next}" 단계로 바로 변경할 수 없습니다.`,
    };
  }

  const prerequisite =
    validateEarlyStagePrerequisite(
      next,
      snapshot,
    );

  if (!prerequisite.ok) {
    return prerequisite;
  }

  return {
    ok: true,
  };
}

export function validatePaymentStatusTransition(
  currentStatus:
    | BookOrderStatus
    | string,
  nextStatus:
    | BookOrderStatus
    | string,
): ValidationResult {
  const current =
    String(currentStatus);

  const next =
    String(nextStatus);

  if (current === next) {
    return {
      ok: true,
    };
  }

  const allowed =
    PAYMENT_TRANSITIONS[
      current
    ];

  if (!allowed) {
    return {
      ok: false,
      message:
        `알 수 없는 현재 결제 상태입니다: ${current}`,
    };
  }

  if (!allowed.includes(next)) {
    return {
      ok: false,
      message:
        `결제 상태를 "${current}"에서 "${next}"로 되돌리거나 건너뛸 수 없습니다.`,
    };
  }

  return {
    ok: true,
  };
}

export function isOrderQuoteLocked(
  order:
    | {
        status?: unknown;
        productionStage?: unknown;
        paymentKey?: unknown;
        paidAt?: unknown;
        manuscriptReceivedAt?: unknown;
        reviewStartedAt?: unknown;
        proofFileUrl?: unknown;
        proofSentAt?: unknown;
        proofApprovedAt?: unknown;
        printOrderedAt?: unknown;
        printingCompletedAt?: unknown;
        shippedAt?: unknown;
        completedAt?: unknown;
      }
    | null
    | undefined,
) {
  if (!order) {
    return false;
  }

  const status =
    String(
      order.status || "",
    );

  const productionStage =
    String(
      order.productionStage ||
        "PREPARING",
    );

  if (
    [
      "PAID",
      "PARTIALLY_REFUNDED",
      "REFUNDED",
    ].includes(status)
  ) {
    return true;
  }

  if (
    productionStage !==
    "PREPARING"
  ) {
    return true;
  }

  return Boolean(
    order.paymentKey ||
      order.paidAt ||
      order.manuscriptReceivedAt ||
      order.reviewStartedAt ||
      order.proofFileUrl ||
      order.proofSentAt ||
      order.proofApprovedAt ||
      order.printOrderedAt ||
      order.printingCompletedAt ||
      order.shippedAt ||
      order.completedAt,
  );
}

function validateEarlyStagePrerequisite(
  nextStage: string,
  snapshot: ProductionSnapshot,
): ValidationResult {
  if (
    [
      "REVIEWING",
      "PROOFING",
      "PROOF_SENT",
    ].includes(nextStage) &&
    !snapshot.manuscriptReceivedAt
  ) {
    return {
      ok: false,
      message:
        "원고 접수일이 없어 다음 제작 단계로 이동할 수 없습니다.",
    };
  }

  if (
    nextStage ===
      "PROOF_SENT" &&
    !cleanText(
      snapshot.proofFileUrl,
    )
  ) {
    return {
      ok: false,
      message:
        "고객에게 전달할 교정본 파일을 먼저 등록해 주세요.",
    };
  }

  return {
    ok: true,
  };
}

function cleanText(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}
