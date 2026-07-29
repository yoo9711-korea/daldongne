const fs = require("fs");
const path = require("path");

const root =
  process.cwd();

const baseUrl =
  (
    process.env
      .FLOW_TEST_BASE_URL ||
    "https://www.daldongne.kr"
  ).replace(/\/+$/, "");

const publicPaths = [
  "/",
  "/pricing",
  "/process",
  "/privacy",
  "/terms",
  "/login",
  "/register",
  "/robots.txt",
  "/sitemap.xml",
];

const protectedPaths = [
  "/dashboard",
  "/dashboard/timeline",
  "/dashboard/interview",
  "/dashboard/book",
  "/dashboard/library",
  "/dashboard/orders",
  "/admin",
  "/admin/orders",
  "/admin/system-test",
];

async function checkPublic(
  pathname,
) {
  const response =
    await fetch(
      `${baseUrl}${pathname}`,
      {
        redirect: "follow",
        headers: {
          "user-agent":
            "DaldongneFlowTest/1.0",
        },
      },
    );

  return {
    type: "PUBLIC",
    pathname,
    ok:
      response.ok,
    status:
      response.status,
    finalUrl:
      response.url,
  };
}

async function checkProtected(
  pathname,
) {
  const response =
    await fetch(
      `${baseUrl}${pathname}`,
      {
        redirect: "follow",
        headers: {
          "user-agent":
            "DaldongneFlowTest/1.0",
        },
      },
    );

  const finalPath =
    new URL(
      response.url,
    ).pathname;

  return {
    type: "PROTECTED",
    pathname,
    ok:
      response.ok &&
      (
        finalPath ===
          "/login" ||
        finalPath.startsWith(
          "/login/",
        ) ||
        finalPath === pathname
      ),
    status:
      response.status,
    finalUrl:
      response.url,
  };
}

async function main() {
  const results = [];

  for (
    const pathname of
    publicPaths
  ) {
    try {
      results.push(
        await checkPublic(
          pathname,
        ),
      );
    } catch (error) {
      results.push({
        type: "PUBLIC",
        pathname,
        ok: false,
        status: 0,
        finalUrl: "",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }

  for (
    const pathname of
    protectedPaths
  ) {
    try {
      results.push(
        await checkProtected(
          pathname,
        ),
      );
    } catch (error) {
      results.push({
        type:
          "PROTECTED",
        pathname,
        ok: false,
        status: 0,
        finalUrl: "",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }

  const failures =
    results.filter(
      (result) =>
        !result.ok,
    );

  const report = [
    "Daldongne Story live customer flow smoke test",
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${baseUrl}`,
    "",
    ...results.map(
      (result) =>
        `- ${
          result.ok
            ? "PASS"
            : "FAIL"
        } ${result.type} ${result.pathname} -> ${result.status} ${result.finalUrl}${
          result.error
            ? ` (${result.error})`
            : ""
        }`,
    ),
    "",
    `Failures: ${failures.length}`,
  ];

  fs.writeFileSync(
    path.join(
      root,
      ".customer-flow-live-report.txt",
    ),
    `${report.join("\n")}\n`,
    "utf8",
  );

  console.log(
    `Live routes: ${results.length}`,
  );

  console.log(
    `Failures: ${failures.length}`,
  );

  console.log(
    "Report: .customer-flow-live-report.txt",
  );

  if (
    failures.length > 0
  ) {
    process.exit(1);
  }

  console.log(
    "Customer flow live test passed.",
  );
}

main().catch(
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
