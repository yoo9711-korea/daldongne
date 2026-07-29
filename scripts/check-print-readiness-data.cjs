const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.bookOrderPrintReadiness.findMany({
    include: {
      order: {
        select: {
          orderId: true,
          status: true,
          proofApprovedAt: true,
          manualPrintJob: {
            select: { status: true },
          },
          printQuotes: {
            where: { status: "SELECTED" },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const quotes = await prisma.bookOrderPrintQuote.findMany({
    orderBy: { createdAt: "desc" },
  });

  const warnings = [];

  for (const row of rows) {
    const prefix = `${row.order.orderId} / ${row.status}`;

    if (
      row.status === "FROZEN" &&
      (!row.specHash || !row.frozenAt || row.blockerCount > 0)
    ) {
      warnings.push(`${prefix}: incomplete frozen record`);
    }

    if (row.status === "READY" && row.blockerCount > 0) {
      warnings.push(`${prefix}: READY has blockers`);
    }

    if (row.order.printQuotes.length > 1) {
      warnings.push(`${prefix}: multiple selected quotes`);
    }

    const jobStatus = row.order.manualPrintJob?.status;

    if (
      jobStatus &&
      jobStatus !== "PREPARING" &&
      row.status !== "FROZEN"
    ) {
      warnings.push(`${prefix}: handoff exists without frozen readiness`);
    }

    if (row.status === "FROZEN" && row.order.status !== "PAID") {
      warnings.push(`${prefix}: frozen order is not PAID`);
    }

    if (row.status === "FROZEN" && !row.order.proofApprovedAt) {
      warnings.push(`${prefix}: frozen order has no proof approval`);
    }
  }

  for (const quote of quotes) {
    const calculated =
      (quote.unitCost || 0) * quote.quantity +
      quote.setupCost +
      quote.shippingCost;

    if (quote.unitCost != null && calculated !== quote.totalCost) {
      warnings.push(`${quote.printerName} / ${quote.id}: total mismatch`);
    }

    if (quote.status === "SELECTED" && !quote.selectedAt) {
      warnings.push(`${quote.printerName} / ${quote.id}: selectedAt missing`);
    }
  }

  const report = [
    "Daldongne Story print readiness data check",
    `Generated: ${new Date().toISOString()}`,
    `Readiness rows: ${rows.length}`,
    `Quote rows: ${quotes.length}`,
    `Warnings: ${warnings.length}`,
    ...warnings.map((x) => `- ${x}`),
  ];

  fs.writeFileSync(
    path.join(process.cwd(), ".print-readiness-data-report.txt"),
    `${report.join("\n")}\n`,
    "utf8",
  );

  console.log(`Print readiness rows: ${rows.length}`);
  console.log(`Print quote rows: ${quotes.length}`);
  console.log(`Print readiness warnings: ${warnings.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
