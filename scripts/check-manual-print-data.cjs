const fs = require("fs");
const path = require("path");
const {
  PrismaClient,
} = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const jobs =
    await prisma.bookOrderManualPrintJob.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        order: {
          select: {
            id: true,
            orderId: true,
            status: true,
            productionStage: true,
            proofApprovedAt: true,
            printOrderedAt: true,
            printingCompletedAt: true,
            recipientName: true,
            recipientPhone: true,
            postalCode: true,
            shippingAddress1: true,
          },
        },
      },
    });

  const warnings = [];

  for (const job of jobs) {
    const prefix =
      `${job.order.orderId} / ${job.status}`;

    if (
      job.status !== "PREPARING" &&
      !job.printerName
    ) {
      warnings.push(
        `${prefix}: printerName missing`,
      );
    }

    if (
      ["SENT", "ACCEPTED", "PRINTING", "COMPLETED"].includes(
        job.status,
      ) &&
      !job.orderSentAt
    ) {
      warnings.push(
        `${prefix}: orderSentAt missing`,
      );
    }

    if (
      ["ACCEPTED", "PRINTING", "COMPLETED"].includes(
        job.status,
      ) &&
      !job.acceptedAt
    ) {
      warnings.push(
        `${prefix}: acceptedAt missing`,
      );
    }

    if (
      job.status === "PRINTING" &&
      !job.printingStartedAt
    ) {
      warnings.push(
        `${prefix}: printingStartedAt missing`,
      );
    }

    if (
      job.status === "COMPLETED" &&
      !job.completedAt
    ) {
      warnings.push(
        `${prefix}: completedAt missing`,
      );
    }

    if (
      job.status !== "PREPARING" &&
      job.order.status !== "PAID"
    ) {
      warnings.push(
        `${prefix}: order is not PAID`,
      );
    }

    if (
      job.status !== "PREPARING" &&
      !job.order.proofApprovedAt
    ) {
      warnings.push(
        `${prefix}: proofApprovedAt missing`,
      );
    }

    if (
      job.status === "SENT" &&
      job.order.productionStage !== "PRINT_ORDERED"
    ) {
      warnings.push(
        `${prefix}: order stage should be PRINT_ORDERED`,
      );
    }

    if (
      ["ACCEPTED", "PRINTING"].includes(job.status) &&
      job.order.productionStage !== "PRINTING"
    ) {
      warnings.push(
        `${prefix}: order stage should be PRINTING`,
      );
    }

    if (
      job.status === "COMPLETED" &&
      ![
        "SHIPPING_PREPARATION",
        "SHIPPED",
        "COMPLETED",
      ].includes(job.order.productionStage)
    ) {
      warnings.push(
        `${prefix}: order stage should be shipping or completed`,
      );
    }

    if (
      job.status === "COMPLETED" &&
      !(
        job.order.recipientName &&
        job.order.recipientPhone &&
        job.order.postalCode &&
        job.order.shippingAddress1
      )
    ) {
      warnings.push(
        `${prefix}: shipping address incomplete`,
      );
    }
  }

  const statusCounts =
    jobs.reduce((result, job) => {
      result[job.status] =
        (result[job.status] || 0) + 1;
      return result;
    }, {});

  const report = [
    "Daldongne Story manual print data check",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Jobs: ${jobs.length}`,
    `Warnings: ${warnings.length}`,
    "",
    "Status counts",
    ...Object.entries(statusCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([status, count]) => `- ${status}: ${count}`),
    "",
    "Warnings",
    ...(warnings.length > 0
      ? warnings.map((warning) => `- ${warning}`)
      : ["- none"]),
  ];

  fs.writeFileSync(
    path.join(
      process.cwd(),
      ".manual-print-data-report.txt",
    ),
    `${report.join("\n")}\n`,
    "utf8",
  );

  console.log(`Manual print jobs: ${jobs.length}`);
  console.log(
    `Manual print warnings: ${warnings.length}`,
  );
  console.log(
    "Report: .manual-print-data-report.txt",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
