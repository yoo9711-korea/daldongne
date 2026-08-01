const fs = require("node:fs");
const path = require("node:path");
const {
  PrismaClient,
} = require("@prisma/client");

loadEnvironmentFile(".env");
loadEnvironmentFile(".env.local");

const prisma = new PrismaClient();
const requestedOrder =
  clean(process.argv[2]);

if (!requestedOrder) {
  console.error(
    "Usage: pnpm test:payment:order -- <orderId-or-record-id>",
  );
  process.exit(1);
}

async function main() {
  const secretKey =
    clean(process.env.TOSS_SECRET_KEY);

  if (!secretKey) {
    throw new Error(
      "TOSS_SECRET_KEY is missing",
    );
  }

  const order =
    await prisma.bookOrder.findFirst({
      where: {
        OR: [
          { id: requestedOrder },
          { orderId: requestedOrder },
        ],
      },
      select: {
        id: true,
        orderId: true,
        totalAmount: true,
        status: true,
        paymentKey: true,
        paymentMethod: true,
        tossStatus: true,
        approvedAmount: true,
        refundedAmount: true,
        balanceAmount: true,
        paymentSyncedAt: true,
        paymentEvents: {
          select: {
            eventType: true,
            status: true,
            amount: true,
            balanceAmount: true,
            transactionKey: true,
            source: true,
            occurredAt: true,
          },
          orderBy: {
            occurredAt: "asc",
          },
        },
      },
    });

  if (!order) {
    throw new Error(
      "The order was not found in the local database",
    );
  }

  const lookupPath = order.paymentKey
    ? `/v1/payments/${encodeURIComponent(order.paymentKey)}`
    : `/v1/payments/orders/${encodeURIComponent(order.orderId)}`;

  const authorization =
    Buffer.from(
      `${secretKey}:`,
      "utf8",
    ).toString("base64");

  const response = await fetch(
    `https://api.tosspayments.com${lookupPath}`,
    {
      headers: {
        Authorization:
          `Basic ${authorization}`,
      },
      cache: "no-store",
    },
  );

  const toss =
    await response
      .json()
      .catch(() => null);

  if (!response.ok || !toss) {
    throw new Error(
      `Toss payment lookup failed (HTTP ${response.status})`,
    );
  }

  const errors = [];

  compare(
    errors,
    "orderId",
    order.orderId,
    clean(toss.orderId),
  );
  compare(
    errors,
    "totalAmount",
    order.totalAmount,
    integer(toss.totalAmount),
  );
  compare(
    errors,
    "paymentKey",
    order.paymentKey,
    clean(toss.paymentKey),
    true,
  );
  compare(
    errors,
    "tossStatus",
    order.tossStatus,
    clean(toss.status),
    true,
  );
  compare(
    errors,
    "balanceAmount",
    order.balanceAmount,
    integer(toss.balanceAmount),
    true,
  );

  const expectedRefunded =
    Math.max(
      0,
      order.totalAmount -
        Math.max(
          0,
          integer(toss.balanceAmount) || 0,
        ),
    );

  if (
    order.approvedAmount > 0 &&
    order.refundedAmount !==
      expectedRefunded
  ) {
    errors.push(
      `refundedAmount: DB=${order.refundedAmount}, Toss-derived=${expectedRefunded}`,
    );
  }

  console.log("");
  console.log("Payment reconciliation report");
  console.log(`- orderId: ${order.orderId}`);
  console.log(`- DB status: ${order.status}`);
  console.log(`- Toss status: ${clean(toss.status)}`);
  console.log(`- approved: ${order.approvedAmount}`);
  console.log(`- refunded: ${order.refundedAmount}`);
  console.log(`- balance: ${order.balanceAmount}`);
  console.log(`- ledger events: ${order.paymentEvents.length}`);
  console.log(`- last synced: ${order.paymentSyncedAt || "not synced"}`);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[FAIL] ${error}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log(
    "PAYMENT_ORDER_RECONCILIATION_PASSED",
  );
}

function compare(
  errors,
  name,
  databaseValue,
  tossValue,
  nullable = false,
) {
  if (
    nullable &&
    (databaseValue === null ||
      databaseValue === "")
  ) {
    return;
  }

  if (databaseValue !== tossValue) {
    errors.push(
      `${name}: DB=${databaseValue}, Toss=${tossValue}`,
    );
  }
}

function integer(value) {
  if (
    typeof value === "number" &&
    Number.isSafeInteger(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed)
      ? parsed
      : null;
  }

  return null;
}

function clean(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function loadEnvironmentFile(relativePath) {
  const fullPath = path.join(
    process.cwd(),
    relativePath,
  );

  if (!fs.existsSync(fullPath)) {
    return;
  }

  const lines = fs
    .readFileSync(fullPath, "utf8")
    .split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (
      !trimmed ||
      trimmed.startsWith("#")
    ) {
      continue;
    }

    const separator =
      trimmed.indexOf("=");

    if (separator <= 0) {
      continue;
    }

    const key =
      trimmed.slice(0, separator).trim();
    let value =
      trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') &&
        value.endsWith('"')) ||
      (value.startsWith("'") &&
        value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

main()
  .catch((error) => {
    console.error(
      "PAYMENT_ORDER_RECONCILIATION_FAILED",
      error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
