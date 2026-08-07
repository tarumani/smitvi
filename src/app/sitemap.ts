import type { MetadataRoute } from "next";
import { listIndexablePublicHubs } from "@/application/seo/indexable-public-hubs";
import { ROUTES } from "@/config/constants";
import { appOrigin } from "@/lib/public-hub-url";

const STATIC_PATHS = [
  ROUTES.home,
  ROUTES.discover,
  ROUTES.search,
  ROUTES.marketplace,
  ROUTES.about,
  ROUTES.contact,
  ROUTES.privacy,
  ROUTES.terms,
  ROUTES.productTrainTwin,
  ROUTES.productTwinChat,
  ROUTES.productConsultations,
  ROUTES.productMarketplace,
  ROUTES.developers,
] as const;

/** Hub URLs need Postgres — must not run during Docker `next build`. */
export const dynamic = "force-dynamic";

function staticSitemapEntries(origin: string, now: Date): MetadataRoute.Sitemap {
  return STATIC_PATHS.map((path) => ({
    url: `${origin}${path}`,
    lastModified: now,
    changeFrequency:
      path === ROUTES.discover || path === ROUTES.marketplace ? "daily" : "weekly",
    priority: path === ROUTES.home ? 1 : path === ROUTES.discover ? 0.9 : 0.7,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = appOrigin();
  const now = new Date();
  const staticEntries = staticSitemapEntries(origin, now);

  try {
    const hubs = await listIndexablePublicHubs();
    const hubEntries: MetadataRoute.Sitemap = hubs.map((hub) => ({
      url: `${origin}${ROUTES.publicProfile(hub.username)}`,
      lastModified: hub.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    return [...staticEntries, ...hubEntries];
  } catch {
    return staticEntries;
  }
}
