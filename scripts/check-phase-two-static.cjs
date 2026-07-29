const fs = require("fs");
const path = require("path");

const root = process.cwd();

const checks = [
  {
    file:
      "src/lib/order-workflow-policy.ts",
    tokens: [
      "validateOrderProductionTransition",
      "validatePaymentStatusTransition",
      "isOrderQuoteLocked",
    ],
  },
  {
    file:
      "src/lib/order-operation-notification.ts",
    tokens: [
      "notifyOrderOperationalStage",
      "EMAIL_FAILED",
      "RESEND_API_KEY",
    ],
  },
  {
    file:
      "src/app/api/admin/production-requests/[id]/production/route.ts",
    tokens: [
      "PHASE_TWO_PRODUCTION_GUARD",
      "validateOrderProductionTransition",
    ],
  },
  {
    file:
      "src/app/api/orders/[id]/proof-review/route.ts",
    tokens: [
      "PHASE_TWO_PROOF_PAYMENT_GUARD",
      "BookOrderStatus.PAID",
    ],
  },
  {
    file:
      "src/app/api/payments/confirm/route.ts",
    tokens: [
      "PHASE_TWO_PAYMENT_CLAIM",
      "PHASE_TWO_PAYMENT_FAILURE_GUARD",
      "updateMany",
    ],
  },
  {
    file:
      "src/app/api/payments/webhook/route.ts",
    tokens: [
      "PHASE_TWO_WEBHOOK_REGRESSION_GUARD",
      "validatePaymentStatusTransition",
    ],
  },
  {
    file:
      "src/app/api/admin/production-requests/[id]/order/route.ts",
    tokens: [
      "PHASE_TWO_QUOTE_LOCK",
      "isOrderQuoteLocked",
    ],
  },
  {
    file:
      "src/app/api/admin/orders/[id]/print-shipping/route.ts",
    tokens: [
      "PHASE_TWO_OPERATION_NOTIFICATION",
      "notifyOrderOperationalStage",
    ],
  },
  {
    file:
      "src/app/admin/system-test/phase-two/page.tsx",
    tokens: [
      "실제 주문 운영",
      "test:phase2:all",
    ],
  },
];

const failures = [];

for (const check of checks) {
  const absolutePath =
    path.join(
      root,
      check.file,
    );

  if (!fs.existsSync(absolutePath)) {
    failures.push(
      `${check.file}: file missing`,
    );

    continue;
  }

  const source =
    fs.readFileSync(
      absolutePath,
      "utf8",
    );

  for (
    const token of
    check.tokens
  ) {
    if (!source.includes(token)) {
      failures.push(
        `${check.file}: missing ${token}`,
      );
    }
  }
}

const packagePath =
  path.join(
    root,
    "package.json",
  );

if (fs.existsSync(packagePath)) {
  const packageJson =
    JSON.parse(
      fs.readFileSync(
        packagePath,
        "utf8",
      ),
    );

  for (
    const script of [
      "test:phase2:policy",
      "test:phase2:static",
      "test:phase2:data",
      "test:phase2:all",
    ]
  ) {
    if (
      !packageJson.scripts?.[
        script
      ]
    ) {
      failures.push(
        `package.json: missing ${script}`,
      );
    }
  }
} else {
  failures.push(
    "package.json: file missing",
  );
}

const report = [
  "Daldongne Story phase two static check",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Checks: ${checks.length}`,
  `Failures: ${failures.length}`,
  ...failures.map(
    (failure) =>
      `- ${failure}`,
  ),
];

fs.writeFileSync(
  path.join(
    root,
    ".phase-two-static-report.txt",
  ),
  `${report.join("\n")}\n`,
  "utf8",
);

console.log(
  `Phase two checks: ${checks.length}`,
);

console.log(
  `Failures: ${failures.length}`,
);

console.log(
  "Report: .phase-two-static-report.txt",
);

if (failures.length > 0) {
  process.exit(1);
}

console.log(
  "Phase two static check passed.",
);
