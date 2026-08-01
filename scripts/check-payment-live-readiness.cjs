const fs = require("node:fs");
const path = require("node:path");

loadEnvironmentFile(".env");
loadEnvironmentFile(".env.local");

const clientKey =
  clean(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
const secretKey =
  clean(process.env.TOSS_SECRET_KEY);
const explicitWebhookUrl =
  clean(process.env.PAYMENT_WEBHOOK_URL);
const nextAuthUrl =
  clean(process.env.NEXTAUTH_URL);

let failed = false;

function pass(message) {
  console.log(`[PASS] ${message}`);
}

function fail(message) {
  console.error(`[FAIL] ${message}`);
  failed = true;
}

function warn(message) {
  console.warn(`[WARN] ${message}`);
}

if (!clientKey) {
  fail("NEXT_PUBLIC_TOSS_CLIENT_KEY is missing");
}

if (!secretKey) {
  fail("TOSS_SECRET_KEY is missing");
}

const clientMode = getKeyMode(clientKey);
const secretMode = getKeyMode(secretKey);

if (clientKey && clientMode === "unknown") {
  fail("Toss client key prefix must be test_ or live_");
}

if (secretKey && secretMode === "unknown") {
  fail("Toss secret key prefix must be test_ or live_");
}

if (
  clientMode !== "unknown" &&
  secretMode !== "unknown" &&
  clientMode !== secretMode
) {
  fail("Toss client key and secret key environments are mixed");
}

if (
  clientMode !== "unknown" &&
  clientMode === secretMode
) {
  pass(`Toss key mode: ${clientMode}`);
}

const webhookUrl = resolveWebhookUrl();

if (!webhookUrl) {
  fail("PAYMENT_WEBHOOK_URL or NEXTAUTH_URL is missing");
} else {
  pass(`Webhook URL: ${webhookUrl}`);
}

async function main() {
  if (!failed && webhookUrl) {
    await checkWebhook(webhookUrl);
  }

  console.log("");
  console.log("Required Toss webhook events:");
  console.log("- PAYMENT_STATUS_CHANGED");
  console.log("- DEPOSIT_CALLBACK");
  console.log("- CANCEL_STATUS_CHANGED (foreign asynchronous cancel only)");

  if (failed) {
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("PAYMENT_LIVE_READINESS_CHECK_PASSED");
}

async function checkWebhook(url) {
  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "daldongne-payment-readiness/1.0",
      },
      body: JSON.stringify({
        eventType:
          "DALDONGNE_PAYMENT_HEALTH_CHECK",
        createdAt:
          new Date().toISOString(),
      }),
      redirect: "manual",
    });
  } catch (error) {
    fail(
      `Webhook endpoint connection failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return;
  }

  const body =
    await response
      .json()
      .catch(() => null);

  if (
    response.status !== 200 ||
    !body ||
    body.ok !== true ||
    body.ignored !== true
  ) {
    fail(
      `Webhook health response is invalid (HTTP ${response.status})`,
    );
    return;
  }

  pass("Webhook endpoint returned a safe ignored response");
}

function resolveWebhookUrl() {
  const raw =
    explicitWebhookUrl ||
    (nextAuthUrl
      ? new URL(
          "/api/payments/webhook",
          ensureTrailingSlash(nextAuthUrl),
        ).toString()
      : "");

  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);

    if (
      url.protocol !== "https:" &&
      url.hostname !== "localhost" &&
      url.hostname !== "127.0.0.1"
    ) {
      fail("Production webhook URL must use HTTPS");
    }

    if (
      url.pathname !==
      "/api/payments/webhook"
    ) {
      warn(
        `Webhook path is ${url.pathname}; expected /api/payments/webhook`,
      );
    }

    return url.toString();
  } catch {
    fail("Webhook URL is not a valid URL");
    return "";
  }
}

function ensureTrailingSlash(value) {
  return value.endsWith("/")
    ? value
    : `${value}/`;
}

function getKeyMode(value) {
  if (value.startsWith("test_")) {
    return "test";
  }

  if (value.startsWith("live_")) {
    return "live";
  }

  return "unknown";
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

main().catch((error) => {
  console.error(
    "PAYMENT_LIVE_READINESS_CHECK_FAILED",
    error,
  );
  process.exitCode = 1;
});
