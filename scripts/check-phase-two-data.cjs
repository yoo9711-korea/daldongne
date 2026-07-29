const fs = require("fs");
const path = require("path");

try {
  const {
    loadEnvConfig,
  } = require("@next/env");

  loadEnvConfig(
    process.cwd(),
  );
} catch {
  // Optional.
}

const {
  PrismaClient,
} = require("@prisma/client");

const prisma =
  new PrismaClient();

const root =
  process.cwd();

const reportPath =
  path.join(
    root,
    ".phase-two-data-report.txt",
  );

const repairPath =
  path.join(
    root,
    ".phase-two-review-plan.txt",
  );

const STAGE_RANK = {
  PREPARING: 0,
  MANUSCRIPT_RECEIVED: 1,
  REVIEWING: 2,
  PROOFING: 3,
  PROOF_SENT: 4,
  PROOF_APPROVED: 5,
  PRINT_ORDERED: 6,
  PRINTING: 7,
  SHIPPING_PREPARATION: 8,
  SHIPPED: 9,
  COMPLETED: 10,
  ON_HOLD: -1,
};

async function main() {
  const orders =
    await prisma.bookOrder.findMany({
      take: 2000,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        orderId: true,
        productName: true,
        quantity: true,
        productAmount: true,
        shippingFee: true,
        totalAmount: true,
        status: true,
        paymentKey: true,
        paidAt: true,
        productionStage: true,
        manuscriptReceivedAt: true,
        proofFileUrl: true,
        proofSentAt: true,
        proofApprovedAt: true,
        printOrderedAt: true,
        printingCompletedAt: true,
        recipientName: true,
        recipientPhone: true,
        postalCode: true,
        shippingAddress1: true,
        shippingCarrier: true,
        trackingNumber: true,
        shippedAt: true,
        completedAt: true,
        book: {
          select: {
            title: true,
            status: true,
          },
        },
        productionRequest: {
          select: {
            status: true,
          },
        },
        _count: {
          select: {
            auditLogs: true,
            proofReviews: true,
          },
        },
      },
    });

  const issues = [];

  function add(
    order,
    severity,
    code,
    message,
  ) {
    issues.push({
      orderRecordId:
        order.id,
      orderId:
        order.orderId,
      bookTitle:
        order.book.title ||
        order.productName,
      severity,
      code,
      message,
    });
  }

  for (
    const order of
    orders
  ) {
    const stage =
      String(
        order.productionStage,
      );

    const status =
      String(
        order.status,
      );

    const rank =
      STAGE_RANK[stage] ?? 0;

    if (
      order.totalAmount !==
      order.productAmount +
        order.shippingFee
    ) {
      add(
        order,
        "CRITICAL",
        "TOTAL_MISMATCH",
        "상품금액 + 배송비와 최종 결제금액이 다릅니다.",
      );
    }

    if (
      status === "PAID" &&
      (
        !order.paidAt ||
        !order.paymentKey
      )
    ) {
      add(
        order,
        "CRITICAL",
        "PAID_DATA_MISSING",
        "PAID 주문의 결제키 또는 승인 시각이 없습니다.",
      );
    }

    if (
      rank >= 1 &&
      status !== "PAID"
    ) {
      add(
        order,
        "CRITICAL",
        "PRODUCTION_BEFORE_PAYMENT",
        `결제 상태 ${status}에서 제작 단계 ${stage}입니다.`,
      );
    }

    if (
      rank >= 1 &&
      !order.manuscriptReceivedAt
    ) {
      add(
        order,
        "CRITICAL",
        "MANUSCRIPT_DATE_MISSING",
        "원고 접수 이후 단계인데 원고 접수일이 없습니다.",
      );
    }

    if (
      rank >= 4 &&
      (
        !order.proofFileUrl ||
        !order.proofSentAt
      )
    ) {
      add(
        order,
        "CRITICAL",
        "PROOF_DELIVERY_MISSING",
        "교정본 파일 또는 전달 시각이 없습니다.",
      );
    }

    if (
      rank >= 5 &&
      !order.proofApprovedAt
    ) {
      add(
        order,
        "CRITICAL",
        "PROOF_APPROVAL_MISSING",
        "교정 승인 이후 단계인데 승인 시각이 없습니다.",
      );
    }

    if (
      rank >= 6 &&
      !order.printOrderedAt
    ) {
      add(
        order,
        "CRITICAL",
        "PRINT_ORDER_DATE_MISSING",
        "인쇄 발주 이후 단계인데 발주일이 없습니다.",
      );
    }

    if (
      rank >= 8 &&
      !order.printingCompletedAt
    ) {
      add(
        order,
        "CRITICAL",
        "PRINT_COMPLETION_MISSING",
        "배송 준비 이후 단계인데 인쇄 완료일이 없습니다.",
      );
    }

    if (
      rank >= 8 &&
      [
        order.recipientName,
        order.recipientPhone,
        order.postalCode,
        order.shippingAddress1,
      ].some(
        (value) =>
          !cleanText(value),
      )
    ) {
      add(
        order,
        "CRITICAL",
        "SHIPPING_ADDRESS_MISSING",
        "배송 준비 이후 단계인데 필수 배송지 정보가 없습니다.",
      );
    }

    if (
      rank >= 9 &&
      (
        !cleanText(
          order.shippingCarrier,
        ) ||
        !cleanText(
          order.trackingNumber,
        ) ||
        !order.shippedAt
      )
    ) {
      add(
        order,
        "CRITICAL",
        "TRACKING_MISSING",
        "배송 중 이후 단계인데 택배사·송장번호·발송일이 없습니다.",
      );
    }

    if (
      rank >= 10 &&
      !order.completedAt
    ) {
      add(
        order,
        "CRITICAL",
        "COMPLETION_DATE_MISSING",
        "제작 완료 단계인데 완료 시각이 없습니다.",
      );
    }

    if (
      stage === "COMPLETED" &&
      String(
        order.book.status,
      ) !== "PUBLISHED"
    ) {
      add(
        order,
        "WARNING",
        "BOOK_STATUS_MISMATCH",
        "완료 주문의 책 상태가 PUBLISHED가 아닙니다.",
      );
    }

    if (
      stage === "COMPLETED" &&
      String(
        order.productionRequest
          .status,
      ) !== "COMPLETED"
    ) {
      add(
        order,
        "WARNING",
        "REQUEST_STATUS_MISMATCH",
        "완료 주문의 제작 상담 상태가 COMPLETED가 아닙니다.",
      );
    }

    if (
      order._count.auditLogs ===
      0
    ) {
      add(
        order,
        "WARNING",
        "AUDIT_MISSING",
        "주문 처리 이력이 없습니다.",
      );
    }
  }

  const critical =
    issues.filter(
      (issue) =>
        issue.severity ===
        "CRITICAL",
    );

  const warnings =
    issues.filter(
      (issue) =>
        issue.severity ===
        "WARNING",
    );

  const report = [
    "Daldongne Story phase two data check",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Orders inspected: ${orders.length}`,
    `Critical issues: ${critical.length}`,
    `Warnings: ${warnings.length}`,
    "",
    ...issues.map(
      (issue) =>
        `- ${issue.severity} ${issue.code} | ${issue.orderId} | ${issue.bookTitle} | ${issue.message}`,
    ),
  ];

  fs.writeFileSync(
    reportPath,
    `${report.join("\n")}\n`,
    "utf8",
  );

  const reviewPlan = [
    "달동네 스토리 2단계 주문별 수동 확인 계획",
    `생성: ${new Date().toISOString()}`,
    "",
    "주의: 이 파일은 운영 DB를 자동 수정하지 않습니다.",
    "각 주문의 관리자 상세 화면에서 원본 결제·교정·인쇄·배송 자료를 확인한 뒤 수정하세요.",
    "",
    ...issues.map(
      (issue, index) => [
        `${index + 1}. [${issue.severity}] ${issue.bookTitle}`,
        `   주문번호: ${issue.orderId}`,
        `   관리자: /admin/orders/${issue.orderRecordId}`,
        `   문제: ${issue.message}`,
        "",
      ].join("\n"),
    ),
  ];

  fs.writeFileSync(
    repairPath,
    `${reviewPlan.join("\n")}\n`,
    "utf8",
  );

  console.log(
    `Orders inspected: ${orders.length}`,
  );

  console.log(
    `Critical issues: ${critical.length}`,
  );

  console.log(
    `Warnings: ${warnings.length}`,
  );

  console.log(
    "Report: .phase-two-data-report.txt",
  );

  console.log(
    "Review plan: .phase-two-review-plan.txt",
  );

  if (
    process.env
      .PHASE_TWO_DATA_STRICT ===
      "1" &&
    critical.length > 0
  ) {
    process.exitCode = 1;
  }
}

function cleanText(
  value,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

main()
  .catch(
    (error) => {
      const message =
        error instanceof Error
          ? error.stack ||
            error.message
          : String(error);

      fs.writeFileSync(
        reportPath,
        `Daldongne Story phase two data check\n\nQUERY ERROR\n${message}\n`,
        "utf8",
      );

      console.error(
        message,
      );

      process.exitCode = 1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
