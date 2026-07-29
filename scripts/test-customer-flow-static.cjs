const fs = require("fs");
const path = require("path");

const root = process.cwd();

const checks = [
  {
    id: "ACCOUNT_REGISTER",
    label: "회원가입",
    required: [
      ["src/app/register/page.tsx"],
    ],
  },
  {
    id: "ACCOUNT_LOGIN",
    label: "로그인과 인증",
    required: [
      ["src/app/login/page.tsx"],
      ["src/auth.ts", "auth.ts"],
    ],
  },
  {
    id: "PHOTO_UPLOAD",
    label: "사진 등록",
    required: [
      ["src/app/dashboard/timeline/page.tsx"],
      [
        "src/app/api/upload/route.ts",
        "src/app/api/memory/route.ts",
      ],
    ],
  },
  {
    id: "STORY_RECORD",
    label: "이야기 등록",
    required: [
      ["src/app/dashboard/interview/page.tsx"],
      [
        "src/app/api/interview/save/route.ts",
        "src/app/api/ai/story/route.ts",
        "src/app/api/memory/route.ts",
      ],
    ],
  },
  {
    id: "BOOK_CREATE",
    label: "책 원고 생성",
    required: [
      ["src/app/dashboard/book/page.tsx"],
      ["src/app/api/book/create-draft/route.ts"],
    ],
  },
  {
    id: "LIBRARY",
    label: "내 책장과 책 상세",
    required: [
      ["src/app/dashboard/library/page.tsx"],
      ["src/app/dashboard/library/[id]/page.tsx"],
    ],
  },
  {
    id: "PRODUCTION_REQUEST",
    label: "제작 상담",
    required: [
      ["src/app/api/book/production-request/route.ts"],
      ["src/app/admin/production-requests/page.tsx"],
    ],
  },
  {
    id: "ORDER",
    label: "주문",
    required: [
      ["src/app/dashboard/orders/page.tsx"],
      ["src/app/admin/orders/page.tsx"],
      ["src/app/admin/orders/[id]/page.tsx"],
    ],
  },
  {
    id: "PAYMENT",
    label: "결제 승인과 웹훅",
    required: [
      ["src/app/api/payments/confirm/route.ts"],
      ["src/app/api/payments/webhook/route.ts"],
    ],
  },
  {
    id: "PROOF",
    label: "교정본과 고객 응답",
    required: [
      ["src/app/admin/proof-reviews/page.tsx"],
      ["src/app/api/orders/[id]/proof-review/route.ts"],
    ],
  },
  {
    id: "PRODUCTION_DELIVERY",
    label: "인쇄·배송 상태",
    required: [
      ["src/app/admin/orders/[id]/page.tsx"],
      [
        "src/app/api/admin/orders/[id]/production/route.ts",
        "src/app/api/admin/orders/[id]/print-shipping/route.ts",
      ],
    ],
  },
  {
    id: "EMAIL",
    label: "고객 이메일",
    required: [
      [
        "src/lib/order-email.ts",
        "src/lib/order-emails.ts",
      ],
    ],
  },
  {
    id: "AUDIT",
    label: "처리 이력",
    required: [
      ["src/app/admin/order-audit/page.tsx"],
      ["src/lib/order-audit.ts"],
    ],
  },
  {
    id: "TEST_CENTER",
    label: "관리자 테스트 센터",
    required: [
      ["src/app/admin/system-test/page.tsx"],
    ],
  },
];

const schemaPath =
  path.join(
    root,
    "prisma",
    "schema.prisma",
  );

const schema =
  fs.existsSync(schemaPath)
    ? fs.readFileSync(
        schemaPath,
        "utf8",
      )
    : "";

const requiredSchemaTokens = [
  "model User",
  "model Memory",
  "model Book",
  "model BookProductionRequest",
  "model BookOrder",
  "model BookOrderProofReview",
  "model BookOrderAuditLog",
  "enum BookOrderStatus",
  "enum BookProductionStage",
  "READY",
  "PAYMENT_PENDING",
  "PAID",
  "PROOF_SENT",
  "PROOF_APPROVED",
  "PRINT_ORDERED",
  "PRINTING",
  "SHIPPING_PREPARATION",
  "SHIPPED",
  "COMPLETED",
  "shippingCarrier",
  "trackingNumber",
  "completedAt",
];

function exists(
  relativePath,
) {
  return fs.existsSync(
    path.join(
      root,
      relativePath,
    ),
  );
}

const results =
  checks.map(
    (check) => {
      const missingGroups = [];

      for (
        const alternatives of
        check.required
      ) {
        const found =
          alternatives.some(
            exists,
          );

        if (!found) {
          missingGroups.push(
            alternatives,
          );
        }
      }

      return {
        ...check,
        ok:
          missingGroups.length ===
          0,
        missingGroups,
      };
    },
  );

const missingSchemaTokens =
  requiredSchemaTokens.filter(
    (token) =>
      !schema.includes(token),
  );

const envFiles = [
  ".env.local",
  ".env",
  ".env.production.local",
].filter(exists);

const envText =
  envFiles
    .map(
      (file) =>
        fs.readFileSync(
          path.join(root, file),
          "utf8",
        ),
    )
    .join("\n");

function hasEnv(
  names,
) {
  return names.some(
    (name) =>
      new RegExp(
        `^${name}=.+`,
        "m",
      ).test(envText) ||
      Boolean(
        process.env[name],
      ),
  );
}

const environmentChecks = [
  {
    label: "데이터베이스",
    names: ["DATABASE_URL"],
    required: true,
  },
  {
    label: "인증 비밀키",
    names: [
      "AUTH_SECRET",
      "NEXTAUTH_SECRET",
    ],
    required: true,
  },
  {
    label: "Google 로그인",
    names: [
      "AUTH_GOOGLE_ID",
      "GOOGLE_CLIENT_ID",
    ],
    required: false,
  },
  {
    label: "Google 로그인 비밀키",
    names: [
      "AUTH_GOOGLE_SECRET",
      "GOOGLE_CLIENT_SECRET",
    ],
    required: false,
  },
  {
    label: "토스 결제 클라이언트키",
    names: [
      "NEXT_PUBLIC_TOSS_CLIENT_KEY",
      "TOSS_CLIENT_KEY",
    ],
    required: false,
  },
  {
    label: "토스 결제 시크릿키",
    names: [
      "TOSS_SECRET_KEY",
      "TOSS_PAYMENTS_SECRET_KEY",
    ],
    required: false,
  },
  {
    label: "이메일 발송",
    names: ["RESEND_API_KEY"],
    required: false,
  },
  {
    label: "이미지 저장",
    names: [
      "BLOB_READ_WRITE_TOKEN",
    ],
    required: false,
  },
].map(
  (item) => ({
    ...item,
    ok: hasEnv(item.names),
  }),
);

const failedChecks =
  results.filter(
    (result) =>
      !result.ok,
  );

const missingRequiredEnvironment =
  environmentChecks.filter(
    (item) =>
      item.required &&
      !item.ok,
  );

const warnings =
  environmentChecks.filter(
    (item) =>
      !item.required &&
      !item.ok,
  );

const report = [
  "Daldongne Story customer flow static test",
  `Generated: ${new Date().toISOString()}`,
  "",
  "Capability checks",
  ...results.map(
    (result) =>
      `- ${
        result.ok
          ? "PASS"
          : "FAIL"
      } ${result.label}${
        result.ok
          ? ""
          : `: ${result.missingGroups
              .map(
                (group) =>
                  group.join(" OR "),
              )
              .join(", ")}`
      }`,
  ),
  "",
  "Schema checks",
  `- ${
    missingSchemaTokens.length ===
    0
      ? "PASS"
      : "FAIL"
  } required models, fields, and statuses`,
  ...missingSchemaTokens.map(
    (token) =>
      `  - missing: ${token}`,
  ),
  "",
  "Environment checks",
  ...environmentChecks.map(
    (item) =>
      `- ${
        item.ok
          ? "READY"
          : item.required
            ? "FAIL"
            : "WARNING"
      } ${item.label}: ${item.names.join(" OR ")}`,
  ),
  "",
  `Failures: ${
    failedChecks.length +
    missingSchemaTokens.length +
    missingRequiredEnvironment.length
  }`,
  `Warnings: ${warnings.length}`,
];

fs.writeFileSync(
  path.join(
    root,
    ".customer-flow-static-report.txt",
  ),
  `${report.join("\n")}\n`,
  "utf8",
);

console.log(
  `Flow capabilities: ${results.length}`,
);

console.log(
  `Failures: ${
    failedChecks.length +
    missingSchemaTokens.length +
    missingRequiredEnvironment.length
  }`,
);

console.log(
  `Warnings: ${warnings.length}`,
);

console.log(
  "Report: .customer-flow-static-report.txt",
);

if (
  failedChecks.length > 0 ||
  missingSchemaTokens.length >
    0 ||
  missingRequiredEnvironment.length >
    0
) {
  process.exit(1);
}

console.log(
  "Customer flow static test passed.",
);
