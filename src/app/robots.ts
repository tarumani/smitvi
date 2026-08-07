import type { MetadataRoute } from "next";
import { appOrigin } from "@/lib/public-hub-url";

export default function robots(): MetadataRoute.Robots {
  const origin = appOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/hub/",
          "/dashboard",
          "/admin/",
          "/settings/",
          "/onboarding",
          "/login",
          "/signup",
          "/api/",
          "/orgs/",
          "/marketplace/sell",
          "/marketplace/orders",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
