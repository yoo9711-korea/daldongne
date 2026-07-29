import type { MetadataRoute } from "next";

const PUBLIC_PATHS = [
  "",
  "/process",
  "/pricing",
  "/trial",
  "/guide",
  "/reviews",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now =
    new Date();

  return PUBLIC_PATHS.map(
    (pathname) => ({
      url:
        `https://www.daldongne.kr${pathname}`,
      lastModified:
        now,
      changeFrequency:
        pathname === ""
          ? "weekly"
          : "monthly",
      priority:
        pathname === ""
          ? 1
          : pathname ===
              "/pricing"
            ? 0.9
            : 0.7,
    }),
  );
}
