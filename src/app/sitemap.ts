import type { MetadataRoute } from "next";
import { listIndexablePublicHubs } from "@/application/seo/indexable-public-hubs";
import { ROUTES } from "@/config/constants";
import { getGuideSlugs } from "@/content/guides";
import { appOrigin } from "@/lib/public-hub-url";

const STATIC_PATHS = [
  ROUTES.home,
  ROUTES.discover,
  ROUTES.search,
  ROUTES.marketplace,
  ROUTES.guides,
  ROUTES.about,
  ROUTES.contact,
  ROUTES.howItHelps,
  ROUTES.pricing,
  ROUTES.privacy,
  ROUTES.terms,
  ROUTES.disclaimer,
  ROUTES.productTrainTwin,
  ROUTES.productTwinChat,
  ROUTES.productConsultations,
  ROUTES.productMarketplace,
  ROUTES.developers,
] as const;

/** Hub URLs need Postgres — must not run during Docker `next build`. */
export const dynamic = "force-dynamic";

function staticSitemapEntries(origin: string, now: Date): MetadataRoute.Sitemap {
  const guideEntries: MetadataRoute.Sitemap = getGuideSlugs().map((slug) => ({
    url: `${origin}${ROUTES.guide(slug)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const baseEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${origin}${path}`,
    lastModified: now,
    changeFrequency:
      path === ROUTES.discover || path === ROUTES.marketplace ? "daily" : "weekly",
    priority:
      path === ROUTES.home
        ? 1
        : path === ROUTES.discover || path === ROUTES.guides
          ? 0.9
          : 0.7,
  }));

  return [...baseEntries, ...guideEntries];
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
