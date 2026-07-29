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
  // Next.js environment loader is optional.
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
    ".customer-flow-data-report.txt",
  );

async function safe(
  label,
  query,
) {
  try {
    return {
      label,
      ok: true,
      value:
        await query(),
    };
  } catch (error) {
    return {
      label,
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

async function main() {
  const checks =
    await Promise.all([
      safe(
        "회원 수",
        () =>
          prisma.user.count(),
      ),
      safe(
        "사진·이야기 수",
        () =>
          prisma.memory.count(),
      ),
      safe(
        "책 원고 수",
        () =>
          prisma.book.count(),
      ),
      safe(
        "제작 상담 수",
        () =>
          prisma.bookProductionRequest.count(),
      ),
      safe(
        "주문 수",
        () =>
          prisma.bookOrder.count(),
      ),
      safe(
        "교정 응답 수",
        () =>
          prisma.bookOrderProofReview.count(),
      ),
      safe(
        "처리 이력 수",
        () =>
          prisma.bookOrderAuditLog.count(),
      ),
      safe(
        "PAID인데 paidAt 없음",
        () =>
          prisma.bookOrder.count({
            where: {
              status: "PAID",
              paidAt: null,
            },
          }),
      ),
      safe(
        "SHIPPED인데 송장 누락",
        () =>
          prisma.bookOrder.count({
            where: {
              productionStage:
                "SHIPPED",
              OR: [
                {
                  shippingCarrier:
                    null,
                },
                {
                  shippingCarrier:
                    "",
                },
                {
                  trackingNumber:
                    null,
                },
                {
                  trackingNumber:
                    "",
                },
              ],
            },
          }),
      ),
      safe(
        "COMPLETED인데 completedAt 없음",
        () =>
          prisma.bookOrder.count({
            where: {
              productionStage:
                "COMPLETED",
              completedAt: null,
            },
          }),
      ),
      safe(
        "주문 상태 분포",
        () =>
          prisma.bookOrder.groupBy({
            by: ["status"],
            _count: {
              _all: true,
            },
            orderBy: {
              status: "asc",
            },
          }),
      ),
      safe(
        "제작 단계 분포",
        () =>
          prisma.bookOrder.groupBy({
            by: [
              "productionStage",
            ],
            _count: {
              _all: true,
            },
            orderBy: {
              productionStage:
                "asc",
            },
          }),
      ),
    ]);

  const failures =
    checks.filter(
      (check) =>
        !check.ok,
    );

  const anomalies =
    checks.filter(
      (check) =>
        check.ok &&
        [
          "PAID인데 paidAt 없음",
          "SHIPPED인데 송장 누락",
          "COMPLETED인데 completedAt 없음",
        ].includes(
          check.label,
        ) &&
        typeof check.value ===
          "number" &&
        check.value > 0,
    );

  const lines = [
    "Daldongne Story customer flow data test",
    `Generated: ${new Date().toISOString()}`,
    "",
    ...checks.flatMap(
      (check) => {
        if (!check.ok) {
          return [
            `- ERROR ${check.label}`,
            `  ${check.error}`,
          ];
        }

        if (
          Array.isArray(
            check.value,
          )
        ) {
          return [
            `- ${check.label}`,
            ...check.value.map(
              (item) =>
                `  ${JSON.stringify(item)}`,
            ),
          ];
        }

        return [
          `- ${check.label}: ${String(check.value)}`,
        ];
      },
    ),
    "",
    `Query errors: ${failures.length}`,
    `Data anomalies: ${anomalies.length}`,
  ];

  fs.writeFileSync(
    reportPath,
    `${lines.join("\n")}\n`,
    "utf8",
  );

  console.log(
    `Database queries: ${checks.length}`,
  );

  console.log(
    `Query errors: ${failures.length}`,
  );

  console.log(
    `Data anomalies: ${anomalies.length}`,
  );

  console.log(
    "Report: .customer-flow-data-report.txt",
  );

  if (
    process.env.FLOW_DATA_STRICT ===
      "1" &&
    (
      failures.length > 0 ||
      anomalies.length > 0
    )
  ) {
    process.exitCode = 1;
  }
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
        `Daldongne Story customer flow data test\n\nDATABASE TEST SKIPPED\n${message}\n`,
        "utf8",
      );

      console.warn(
        "Database test could not run. See .customer-flow-data-report.txt",
      );

      if (
        process.env.FLOW_DATA_STRICT ===
        "1"
      ) {
        process.exitCode = 1;
      }
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
