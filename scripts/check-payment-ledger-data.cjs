const {
  PrismaClient,
} = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const orders =
    await prisma.bookOrder.findMany({
      where: {
        paymentSyncedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        orderId: true,
        totalAmount: true,
        status: true,
        paidAt: true,
        tossStatus: true,
        approvedAmount: true,
        refundedAmount: true,
        balanceAmount: true,
        paymentSyncedAt: true,
        _count: {
          select: {
            paymentEvents: true,
          },
        },
      },
      orderBy: {
        paymentSyncedAt: "desc",
      },
      take: 5000,
    });

  const errors = [];
  const warnings = [];

  for (const order of orders) {
    const prefix =
      `${order.orderId} (${order.id})`;

    const values = [
      ["totalAmount", order.totalAmount],
      ["approvedAmount", order.approvedAmount],
      ["refundedAmount", order.refundedAmount],
      ["balanceAmount", order.balanceAmount],
    ];

    for (const [name, value] of values) {
      if (
        value !== null &&
        (!Number.isSafeInteger(value) ||
          value < 0)
      ) {
        errors.push(
          `${prefix}: invalid ${name}=${value}`,
        );
      }
    }

    const approved =
      order.approvedAmount || 0;
    const refunded =
      order.refundedAmount || 0;
    const balance =
      order.balanceAmount || 0;

    if (approved > order.totalAmount) {
      errors.push(
        `${prefix}: approved amount exceeds total`,
      );
    }

    if (refunded > approved) {
      errors.push(
        `${prefix}: refunded amount exceeds approved amount`,
      );
    }

    if (balance > order.totalAmount) {
      errors.push(
        `${prefix}: balance exceeds total amount`,
      );
    }

    if (
      approved > 0 &&
      refunded + balance !== approved
    ) {
      errors.push(
        `${prefix}: refunded + balance does not equal approved`,
      );
    }

    if (
      order.status === "PAID" &&
      (approved !== order.totalAmount ||
        refunded !== 0 ||
        balance !== approved)
    ) {
      warnings.push(
        `${prefix}: PAID aggregate values need resync`,
      );
    }

    if (
      order.status ===
        "PARTIALLY_REFUNDED" &&
      (refunded <= 0 || balance <= 0)
    ) {
      errors.push(
        `${prefix}: invalid partial refund aggregates`,
      );
    }

    if (
      order.status === "REFUNDED" &&
      (approved <= 0 ||
        refunded !== approved ||
        balance !== 0)
    ) {
      errors.push(
        `${prefix}: invalid full refund aggregates`,
      );
    }

    if (
      order._count.paymentEvents === 0
    ) {
      warnings.push(
        `${prefix}: no payment ledger event yet`,
      );
    }
  }

  console.log(
    `Checked ${orders.length} synchronized orders.`,
  );

  for (const warning of warnings) {
    console.warn(
      `[WARN] ${warning}`,
    );
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(
        `[FAIL] ${error}`,
      );
    }

    process.exitCode = 1;
    return;
  }

  console.log(
    "PAYMENT_LEDGER_DATA_CHECK_PASSED",
  );
}

main()
  .catch((error) => {
    console.error(
      "PAYMENT_LEDGER_DATA_CHECK_FAILED",
      error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
