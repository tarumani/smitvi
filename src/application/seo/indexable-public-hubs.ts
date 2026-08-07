import {
  profileHasDiscoverableHubCopy,
  qualifiedPublicHubProfileWhere,
} from "@/domain/profile/qualified-public-hub";
import { prisma } from "@/infrastructure/database/prisma";

const SITEMAP_HUB_LIMIT = 5000;

export type IndexablePublicHub = {
  username: string;
  updatedAt: Date;
};

export function isIndexablePublicHubProfile(profile: {
  visibility: string;
  isOnboarded: boolean;
  bio: string | null;
  headline: string | null;
}): boolean {
  if (profile.visibility !== "PUBLIC" || !profile.isOnboarded) return false;
  return profileHasDiscoverableHubCopy(profile);
}

/** Hubs that match Discover/Search quality bar (public READY source + bio/headline). */
export async function listIndexablePublicHubs(
  limit = SITEMAP_HUB_LIMIT,
): Promise<IndexablePublicHub[]> {
  const rows = await prisma.profile.findMany({
    where: qualifiedPublicHubProfileWhere,
    orderBy: { updatedAt: "desc" },
    take: limit * 2,
    select: {
      username: true,
      updatedAt: true,
      bio: true,
      headline: true,
    },
  });

  return rows
    .filter((row) => profileHasDiscoverableHubCopy(row))
    .slice(0, limit)
    .map(({ username, updatedAt }) => ({ username, updatedAt }));
}

export async function profileUserHasIndexableTwin(userId: string): Promise<boolean> {
  const ready = await prisma.knowledgeSource.count({
    where: {
      userId,
      isPublic: true,
      status: "READY",
      organizationId: null,
    },
  });
  return ready > 0;
}

export async function isFullyIndexablePublicHub(input: {
  userId: string;
  visibility: string;
  isOnboarded: boolean;
  bio: string | null;
  headline: string | null;
}): Promise<boolean> {
  if (!isIndexablePublicHubProfile(input)) return false;
  return profileUserHasIndexableTwin(input.userId);
}
