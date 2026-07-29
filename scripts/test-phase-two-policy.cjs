const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

const root = process.cwd();

const policyPath =
  path.join(
    root,
    "src",
    "lib",
    "order-workflow-policy.ts",
  );

if (!fs.existsSync(policyPath)) {
  throw new Error(
    "order-workflow-policy.ts was not found.",
  );
}

const source =
  fs.readFileSync(
    policyPath,
    "utf8",
  );

const transpiled =
  ts.transpileModule(
    source,
    {
      compilerOptions: {
        module:
          ts.ModuleKind.CommonJS,
        target:
          ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
      fileName:
        policyPath,
      reportDiagnostics: true,
    },
  );

const diagnostics =
  transpiled.diagnostics || [];

if (diagnostics.length > 0) {
  throw new Error(
    diagnostics
      .map(
        (diagnostic) =>
          ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n",
          ),
      )
      .join("\n"),
  );
}

const testModule =
  new Module(
    policyPath,
    module,
  );

testModule.filename =
  policyPath;

testModule.paths =
  Module._nodeModulePaths(
    path.dirname(policyPath),
  );

testModule._compile(
  transpiled.outputText,
  policyPath,
);

const policy =
  testModule.exports;

const tests = [
  {
    name:
      "paid forward production",
    actual:
      policy.validateOrderProductionTransition({
        currentStage:
          "PREPARING",
        nextStage:
          "MANUSCRIPT_RECEIVED",
        orderStatus:
          "PAID",
        snapshot: {},
      }).ok,
    expected: true,
  },
  {
    name:
      "unpaid production rejected",
    actual:
      policy.validateOrderProductionTransition({
        currentStage:
          "PREPARING",
        nextStage:
          "MANUSCRIPT_RECEIVED",
        orderStatus:
          "READY",
        snapshot: {},
      }).ok,
    expected: false,
  },
  {
    name:
      "late stage bypass rejected",
    actual:
      policy.validateOrderProductionTransition({
        currentStage:
          "PROOF_SENT",
        nextStage:
          "PRINT_ORDERED",
        orderStatus:
          "PAID",
        snapshot: {
          proofFileUrl:
            "/proof.pdf",
          proofSentAt:
            new Date(),
          proofApprovedAt:
            new Date(),
        },
      }).ok,
    expected: false,
  },
  {
    name:
      "proof file prerequisite",
    actual:
      policy.validateOrderProductionTransition({
        currentStage:
          "PROOFING",
        nextStage:
          "PROOF_SENT",
        orderStatus:
          "PAID",
        snapshot: {
          manuscriptReceivedAt:
            new Date(),
        },
      }).ok,
    expected: false,
  },
  {
    name:
      "proof sent allowed",
    actual:
      policy.validateOrderProductionTransition({
        currentStage:
          "PROOFING",
        nextStage:
          "PROOF_SENT",
        orderStatus:
          "PAID",
        snapshot: {
          manuscriptReceivedAt:
            new Date(),
          proofFileUrl:
            "/proof.pdf",
        },
      }).ok,
    expected: true,
  },
  {
    name:
      "paid cannot regress to failed",
    actual:
      policy.validatePaymentStatusTransition(
        "PAID",
        "FAILED",
      ).ok,
    expected: false,
  },
  {
    name:
      "paid can refund",
    actual:
      policy.validatePaymentStatusTransition(
        "PAID",
        "REFUNDED",
      ).ok,
    expected: true,
  },
  {
    name:
      "refunded terminal",
    actual:
      policy.validatePaymentStatusTransition(
        "REFUNDED",
        "PAID",
      ).ok,
    expected: false,
  },
  {
    name:
      "quote locked after production",
    actual:
      policy.isOrderQuoteLocked({
        status:
          "READY",
        productionStage:
          "REVIEWING",
      }),
    expected: true,
  },
  {
    name:
      "quote editable before payment",
    actual:
      policy.isOrderQuoteLocked({
        status:
          "READY",
        productionStage:
          "PREPARING",
      }),
    expected: false,
  },
];

const failures =
  tests.filter(
    (test) =>
      test.actual !==
      test.expected,
  );

for (const test of tests) {
  console.log(
    `${test.actual === test.expected ? "PASS" : "FAIL"} ${test.name}`,
  );
}

console.log(
  `Policy tests: ${tests.length}`,
);

console.log(
  `Failures: ${failures.length}`,
);

if (failures.length > 0) {
  process.exit(1);
}

console.log(
  "Phase two workflow policy test passed.",
);
