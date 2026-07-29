import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/family/",
          "/orders/",
          "/payment/",
        ],
      },
    ],
    sitemap:
      "https://www.daldongne.kr/sitemap.xml",
    host:
      "https://www.daldongne.kr",
  };
}
