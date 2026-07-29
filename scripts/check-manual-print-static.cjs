const fs = require("fs");
const path = require("path");

const root = process.cwd();

const checks = [
  {
    file: "prisma/schema.prisma",
    patterns: [
      "model BookOrderManualPrintJob",
      "manualPrintJob",
      '@@map("book_order_manual_print_jobs")',
    ],
  },
  {
    file:
      "prisma/manual-migrations/20260730_add_manual_print_jobs.sql",
    patterns: [
      "book_order_manual_print_jobs",
      "REFERENCES public.book_orders",
    ],
  },
  {
    file: "src/app/admin/manual-print/page.tsx",
    patterns: [
      "수동 인쇄 운영",
      "manualPrintJob",
    ],
  },
  {
    file:
      "src/app/admin/manual-print/[id]/page.tsx",
    patterns: [
      "ManualPrintJobForm",
      "인쇄 발주서",
    ],
  },
  {
    file:
      "src/app/admin/manual-print/[id]/sheet/page.tsx",
    patterns: [
      "인쇄 발주서",
      "ManualPrintSheetActions",
    ],
  },
  {
    file:
      "src/app/api/admin/orders/[id]/manual-print/route.ts",
    patterns: [
      "MARK_SENT",
      "MARK_ACCEPTED",
      "MARK_PRINTING",
      "MARK_COMPLETED",
      "BookOrderStatus.PAID",
      "proofApprovedAt",
      "assertShippingAddress",
      'category: "PRODUCTION"',
    ],
  },
  {
    file:
      "src/components/admin/ManualPrintJobForm.tsx",
    patterns: [
      "인쇄소 전달 등록",
      "인쇄소 접수 확인",
      "인쇄 완료·배송 준비",
    ],
  },
  {
    file:
      "src/components/admin/AdminNavigation.tsx",
    patterns: [
      "/admin/manual-print",
      "수동 인쇄 운영",
    ],
  },
];

const failures = [];

for (const check of checks) {
  const absolutePath = path.join(root, check.file);

  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing file: ${check.file}`);
    continue;
  }

  const content = fs.readFileSync(
    absolutePath,
    "utf8",
  );

  for (const pattern of check.patterns) {
    if (!content.includes(pattern)) {
      failures.push(
        `${check.file}: missing ${pattern}`,
      );
    }
  }
}

const forbiddenPhrases = [
  "인쇄소로 자동 발주",
  "자동 인쇄됩니다",
];

for (const file of [
  "src/app/admin/manual-print/page.tsx",
  "src/app/admin/manual-print/[id]/page.tsx",
  "src/components/admin/ManualPrintJobForm.tsx",
]) {
  const absolutePath = path.join(root, file);

  if (!fs.existsSync(absolutePath)) {
    continue;
  }

  const content = fs.readFileSync(
    absolutePath,
    "utf8",
  );

  for (const phrase of forbiddenPhrases) {
    if (content.includes(phrase)) {
      failures.push(
        `${file}: forbidden phrase ${phrase}`,
      );
    }
  }
}

const report = [
  "Daldongne Story manual print static check",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Checks: ${checks.length}`,
  `Failures: ${failures.length}`,
  ...failures.map((failure) => `- ${failure}`),
];

fs.writeFileSync(
  path.join(
    root,
    ".manual-print-static-report.txt",
  ),
  `${report.join("\n")}\n`,
  "utf8",
);

console.log(
  `Manual print static failures: ${failures.length}`,
);

console.log(
  "Report: .manual-print-static-report.txt",
);

if (failures.length > 0) {
  process.exit(1);
}

console.log(
  "Manual print static check passed.",
);
