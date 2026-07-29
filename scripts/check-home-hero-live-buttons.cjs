const fs = require("fs");
const path = require("path");

const root = process.cwd();

const checks = [
  {
    file:
      "src/components/home/HomeHeroInteractiveControls.tsx",
    patterns: [
      "HomeHeroInteractiveControls",
      "사진 올리기",
      "이야기 남기기",
      "내 기억 보기",
      "/dashboard/timeline",
      "/dashboard/interview",
      "/dashboard/library",
      "login?callbackUrl=",
      "home-hero-live-categories",
      "home-hero-live-actions",
    ],
  },
  {
    file: "src/app/page.tsx",
    patterns: [
      'import HomeHeroInteractiveControls from "@/components/home/HomeHeroInteractiveControls";',
      "<HomeHeroInteractiveControls />",
      "home-main-reference-v2.webp",
    ],
  },
];

const failures = [];

for (const check of checks) {
  const filePath = path.join(
    root,
    check.file,
  );

  if (!fs.existsSync(filePath)) {
    failures.push(
      `Missing file: ${check.file}`,
    );
    continue;
  }

  const content = fs.readFileSync(
    filePath,
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

const pagePath = path.join(
  root,
  "src/app/page.tsx",
);

if (fs.existsSync(pagePath)) {
  const page = fs.readFileSync(
    pagePath,
    "utf8",
  );

  const imageIndex = page.indexOf(
    'src="/home/reference-home-v1/home-main-reference-v2.webp"',
  );

  const controlsIndex = page.indexOf(
    "<HomeHeroInteractiveControls />",
  );

  if (
    imageIndex < 0 ||
    controlsIndex < 0 ||
    controlsIndex < imageIndex
  ) {
    failures.push(
      "Interactive controls are not rendered after the hero image.",
    );
  }

  const count =
    page.match(
      /<HomeHeroInteractiveControls\s*\/>/g,
    )?.length || 0;

  if (count !== 1) {
    failures.push(
      `Expected one interactive controls component, found ${count}.`,
    );
  }
}

const report = [
  "Daldongne Story homepage live hero controls check",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Failures: ${failures.length}`,
  ...failures.map(
    (failure) => `- ${failure}`,
  ),
];

fs.writeFileSync(
  path.join(
    root,
    ".home-hero-live-buttons-report.txt",
  ),
  `${report.join("\n")}\n`,
  "utf8",
);

console.log(
  `Home hero live button failures: ${failures.length}`,
);

if (failures.length > 0) {
  process.exit(1);
}

console.log(
  "Home hero live button check passed.",
);
