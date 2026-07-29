const fs = require("fs");
const path = require("path");

const root = process.cwd();

const bannedTerms = [
  "라이프픽스 홈케어 부설 달동네 출판사",
  "라이프픽스 홈케어 부설 출판사 달동네",
  "출판사 달동네",
  "달동네 출판사",
  "달동네 스토리북",
  "DAL-DONG-NE PUBLISHING",
  "DALDONGNE PUBLISHING",
  "Daldongne Publishing",
  "DALDONGNE STORYBOOK",
  "Daldongne Storybook",
];

const textExtensions =
  new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".html",
    ".htm",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".md",
    ".mdx",
    ".txt",
    ".xml",
    ".yml",
    ".yaml",
    ".webmanifest",
  ]);

const candidateRoots = [
  "src",
  "public",
  "prisma",
  "emails",
  "content",
  "data",
  "templates",
].filter((relativePath) =>
  fs.existsSync(
    path.join(
      root,
      relativePath,
    ),
  ),
);

const excludedDirectoryNames =
  new Set([
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    ".brand-unification-backup",
  ]);

const findings = [];

function normalizeRelative(
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

function walk(
  directoryPath,
) {
  const entries =
    fs.readdirSync(
      directoryPath,
      {
        withFileTypes: true,
      },
    );

  for (
    const entry of entries
  ) {
    if (
      entry.name.endsWith(
        ".bak",
      )
    ) {
      continue;
    }

    const absolutePath =
      path.join(
        directoryPath,
        entry.name,
      );

    if (
      entry.isDirectory()
    ) {
      if (
        excludedDirectoryNames.has(
          entry.name,
        )
      ) {
        continue;
      }

      walk(
        absolutePath,
      );

      continue;
    }

    if (
      !entry.isFile() ||
      !textExtensions.has(
        path
          .extname(
            absolutePath,
          )
          .toLowerCase(),
      )
    ) {
      continue;
    }

    const text =
      fs.readFileSync(
        absolutePath,
        "utf8",
      );

    const lines =
      text.split(/\r?\n/);

    lines.forEach(
      (line, index) => {
        for (
          const term of
          bannedTerms
        ) {
          if (
            line.includes(
              term,
            )
          ) {
            findings.push({
              file:
                normalizeRelative(
                  absolutePath,
                ),
              line:
                index + 1,
              term,
            });
          }
        }
      },
    );
  }
}

for (
  const relativeRoot of
  candidateRoots
) {
  walk(
    path.join(
      root,
      relativeRoot,
    ),
  );
}

if (
  findings.length > 0
) {
  console.error("");
  console.error(
    "Old brand names were found:",
  );

  for (
    const finding of
    findings
  ) {
    console.error(
      `- ${finding.file}:${finding.line} ${finding.term}`,
    );
  }

  process.exit(1);
}

console.log(
  "Brand check passed: 달동네 스토리 / DALDONGNE STORY",
);
