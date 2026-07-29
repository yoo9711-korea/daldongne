const fs = require("fs");
const path = require("path");

const root = process.cwd();

const checks = [
  ["prisma/schema.prisma", [
    "model BookOrderPrintReadiness",
    "model BookOrderPrintQuote",
    "printReadiness",
    "printQuotes",
  ]],
  ["prisma/manual-migrations/20260730_add_print_readiness_and_quotes.sql", [
    "book_order_print_readiness",
    "book_order_print_quotes",
  ]],
  ["src/lib/print-readiness.ts", [
    "evaluateReadiness",
    "specHash",
    "checkHandoffReadiness",
  ]],
  ["src/app/admin/print-readiness/page.tsx", [
    "인쇄 준비 점검",
    "printReadiness",
  ]],
  ["src/app/admin/print-readiness/[id]/page.tsx", [
    "PrintPreparationPanel",
    "evaluateReadiness",
  ]],
  ["src/components/admin/PrintPreparationPanel.tsx", [
    "점검 완료·사양 동결",
    "인쇄소 견적 비교",
    "PDF 수동 확인표",
  ]],
  ["src/app/api/admin/orders/[id]/print-readiness/route.ts", [
    "PRINT_SPEC_FROZEN",
    "PRINT_SPEC_UNFROZEN",
    "bookOrderPrintReadiness",
  ]],
  ["src/app/api/admin/orders/[id]/print-quotes/route.ts", [
    "PRINT_QUOTE_ADDED",
    "PRINT_QUOTE_SELECTED",
  ]],
  ["src/app/api/admin/orders/[id]/manual-print/route.ts", [
    "checkHandoffReadiness",
    "handoffCheck",
  ]],
  ["src/components/admin/AdminNavigation.tsx", [
    "/admin/print-readiness",
    "인쇄 준비 점검",
  ]],
];

const failures = [];

for (const [file, patterns] of checks) {
  const filePath = path.join(root, file);

  if (!fs.existsSync(filePath)) {
    failures.push(`Missing file: ${file}`);
    continue;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      failures.push(`${file}: missing ${pattern}`);
    }
  }
}

const manualApiPath = path.join(
  root,
  "src/app/api/admin/orders/[id]/manual-print/route.ts",
);

if (fs.existsSync(manualApiPath)) {
  const content = fs.readFileSync(manualApiPath, "utf8");
  const checkIndex = content.indexOf("const handoffCheck");
  const sentIndex = content.indexOf('nextJobStatus = "SENT"');

  if (checkIndex < 0 || sentIndex < 0 || checkIndex > sentIndex) {
    failures.push("Manual print handoff check is not placed before SENT.");
  }
}

const report = [
  "Daldongne Story print readiness static check",
  `Generated: ${new Date().toISOString()}`,
  `Failures: ${failures.length}`,
  ...failures.map((x) => `- ${x}`),
];

fs.writeFileSync(
  path.join(root, ".print-readiness-static-report.txt"),
  `${report.join("\n")}\n`,
  "utf8",
);

console.log(`Print readiness static failures: ${failures.length}`);

if (failures.length > 0) {
  process.exit(1);
}

console.log("Print readiness static check passed.");
