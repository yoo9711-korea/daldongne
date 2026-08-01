const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const files = {
  schema: "prisma/schema.prisma",
  ledger: "src/lib/payment-ledger.ts",
  actions: "src/app/admin/orders/actions.ts",
  panel: "src/components/admin/AdminPaymentManagementPanel.tsx",
  confirm: "src/app/api/payments/confirm/route.ts",
  webhook: "src/app/api/payments/webhook/route.ts",
};

let failed = false;

function read(relativePath) {
  const fullPath = path.join(
    root,
    relativePath,
  );

  if (!fs.existsSync(fullPath)) {
    console.error(
      `[FAIL] missing file: ${relativePath}`,
    );
    failed = true;
    return "";
  }

  return fs.readFileSync(
    fullPath,
    "utf8",
  );
}

function requireText(
  content,
  text,
  label,
) {
  if (!content.includes(text)) {
    console.error(
      `[FAIL] ${label}: ${text}`,
    );
    failed = true;
  } else {
    console.log(
      `[PASS] ${label}`,
    );
  }
}

const schema = read(files.schema);
const ledger = read(files.ledger);
const actions = read(files.actions);
const panel = read(files.panel);
const confirm = read(files.confirm);
const webhook = read(files.webhook);

requireText(
  schema,
  "model BookOrderPaymentEvent",
  "payment event table",
);
requireText(
  schema,
  "refundedAmount",
  "refund aggregate field",
);
requireText(
  ledger,
  "wasPaid?: boolean",
  "paid cancellation distinction",
);
requireText(
  actions,
  "cancelAmount",
  "partial refund amount",
);
requireText(
  actions,
  "refundReceiveAccount",
  "virtual-account refund payload",
);
requireText(
  actions,
  "admin-refund-v3",
  "request-scoped refund idempotency",
);
requireText(
  actions,
  "maskAccountNumber",
  "refund account masking",
);
requireText(
  panel,
  "refundRequestKey",
  "request-scoped refund token",
);
requireText(
  panel,
  "결제·환불 원장",
  "administrator payment ledger UI",
);
requireText(
  panel,
  "refundAccountNumber",
  "virtual-account refund form",
);
requireText(
  confirm,
  "wasPaid: isPaid",
  "confirm reconciliation context",
);
requireText(
  webhook,
  "order.approvedAmount",
  "webhook reconciliation context",
);

if (/refund(AccountNumber|HolderName|Bank)\s+String/.test(schema)) {
  console.error(
    "[FAIL] raw refund account fields must not be persisted in Prisma schema",
  );
  failed = true;
} else {
  console.log(
    "[PASS] raw refund account is not persisted",
  );
}

if (failed) {
  process.exit(1);
}

console.log(
  "PAYMENT_SYSTEM_STATIC_CHECK_PASSED",
);
