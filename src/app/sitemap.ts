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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = appOrigin();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${origin}${path}`,
    lastModified: now,
    changeFrequency: path === ROUTES.discover || path === ROUTES.marketplace ? "daily" : "weekly",
    priority: path === ROUTES.home ? 1 : path === ROUTES.discover ? 0.9 : 0.7,
  }));

  const hubs = await listIndexablePublicHubs();
  const hubEntries: MetadataRoute.Sitemap = hubs.map((hub) => ({
    url: `${origin}${ROUTES.publicProfile(hub.username)}`,
    lastModified: hub.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...hubEntries];
}
