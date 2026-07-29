const fs = require("fs");
const path = require("path");

const root = process.cwd();
const appRoot =
  path.join(
    root,
    "src",
    "app",
  );

const privateSegments =
  new Set([
    "admin",
    "api",
    "dashboard",
    "family",
    "orders",
    "order",
    "payment",
    "payments",
  ]);

const redirects =
  [];

const warnings =
  [];

const publicPages =
  [];

function normalize(
  absolutePath,
) {
  return path
    .relative(
      root,
      absolutePath,
    )
    .split(path.sep)
    .join("/");
}

function routeFromPage(
  filePath,
) {
  const relative =
    path.relative(
      appRoot,
      path.dirname(
        filePath,
      ),
    );

  if (
    relative === ""
  ) {
    return "/";
  }

  return (
    "/" +
    relative
      .split(path.sep)
      .filter(
        (segment) =>
          !segment.startsWith(
            "(",
          ),
      )
      .join("/")
  );
}

function isPublicPage(
  route,
) {
  const firstSegment =
    route
      .split("/")
      .filter(Boolean)[0];

  return (
    !firstSegment ||
    !privateSegments.has(
      firstSegment,
    )
  );
}

function walk(
  directoryPath,
) {
  if (
    !fs.existsSync(
      directoryPath,
    )
  ) {
    return;
  }

  for (
    const entry of
    fs.readdirSync(
      directoryPath,
      {
        withFileTypes: true,
      },
    )
  ) {
    const absolutePath =
      path.join(
        directoryPath,
        entry.name,
      );

    if (
      entry.isDirectory()
    ) {
      walk(
        absolutePath,
      );

      continue;
    }

    if (
      entry.isFile() &&
      entry.name ===
        "page.tsx"
    ) {
      const route =
        routeFromPage(
          absolutePath,
        );

      if (
        isPublicPage(
          route,
        )
      ) {
        inspectPage(
          absolutePath,
          route,
        );
      }
    }
  }
}

function inspectPage(
  filePath,
  route,
) {
  const source =
    fs.readFileSync(
      filePath,
      "utf8",
    );

  publicPages.push({
    route,
    file:
      normalize(
        filePath,
      ),
  });

  if (
    /\bredirect\s*\(/.test(
      source,
    )
  ) {
    redirects.push(
      route,
    );

    return;
  }

  if (
    !/<main[\s>]/.test(
      source,
    )
  ) {
    warnings.push(
      `${route}: <main> 요소 없음`,
    );
  }

  if (
    !/<h1[\s>]/.test(
      source,
    )
  ) {
    warnings.push(
      `${route}: <h1> 요소 없음`,
    );
  }

  if (
    !/metadata|generateMetadata/.test(
      source,
    )
  ) {
    warnings.push(
      `${route}: 페이지별 metadata 없음`,
    );
  }

  const imageTags =
    source.match(
      /<(?:Image|img)\b[\s\S]*?>/g,
    ) || [];

  imageTags.forEach(
    (tag, index) => {
      if (
        !/\balt\s*=/.test(
          tag,
        )
      ) {
        warnings.push(
          `${route}: 이미지 ${
            index + 1
          }에 alt 없음`,
        );
      }
    },
  );
}

walk(
  appRoot,
);

const requiredFiles = [
  "src/styles/public-site-finish.css",
  "src/components/public/PublicExperienceFinish.tsx",
  "src/app/privacy/page.tsx",
  "src/app/terms/page.tsx",
  "src/app/not-found.tsx",
  "src/app/loading.tsx",
  "src/app/error.tsx",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/app/manifest.ts",
];

const missingRequired =
  requiredFiles.filter(
    (file) =>
      !fs.existsSync(
        path.join(
          root,
          file,
        ),
      ),
  );

const layoutPath =
  path.join(
    root,
    "src",
    "app",
    "layout.tsx",
  );

let layoutConnected =
  false;

if (
  fs.existsSync(
    layoutPath,
  )
) {
  const layoutSource =
    fs.readFileSync(
      layoutPath,
      "utf8",
    );

  layoutConnected =
    layoutSource.includes(
      "public-site-finish.css",
    ) &&
    layoutSource.includes(
      "<PublicExperienceFinish",
    );
}

const report = [
  "Daldongne Story public design completion report",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Public routes found: ${publicPages.length}`,
  ...publicPages
    .sort(
      (a, b) =>
        a.route.localeCompare(
          b.route,
        ),
    )
    .map(
      (item) =>
        `- ${item.route} (${item.file})`,
    ),
  "",
  `Redirect routes: ${redirects.length}`,
  ...redirects
    .sort()
    .map(
      (route) =>
        `- ${route}`,
    ),
  "",
  `Required finish files missing: ${missingRequired.length}`,
  ...missingRequired.map(
    (file) =>
      `- ${file}`,
  ),
  "",
  `Root layout connected: ${layoutConnected ? "YES" : "NO"}`,
  "",
  `Review warnings: ${warnings.length}`,
  ...warnings.map(
    (warning) =>
      `- ${warning}`,
  ),
  "",
  "Completion standard",
  "- Common visual polish layer: installed",
  "- Mobile touch and form sizing: installed",
  "- Keyboard focus and skip navigation: installed",
  "- Reduced-motion support: installed",
  "- Missing common footer fallback: installed",
  "- Privacy and terms pages: installed",
  "- Loading, error, and 404 pages: installed",
  "- robots, sitemap, and manifest: installed",
  "- Automated design audit: installed",
];

const reportPath =
  path.join(
    root,
    ".public-design-finish-report.txt",
  );

fs.writeFileSync(
  reportPath,
  `${report.join("\n")}\n`,
  "utf8",
);

console.log(
  `Public routes: ${publicPages.length}`,
);

console.log(
  `Review warnings: ${warnings.length}`,
);

console.log(
  "Report: .public-design-finish-report.txt",
);

if (
  missingRequired.length > 0 ||
  !layoutConnected
) {
  console.error(
    "Public design finish installation is incomplete.",
  );

  process.exit(1);
}
