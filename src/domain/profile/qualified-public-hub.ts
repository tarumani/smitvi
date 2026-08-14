import type { Prisma } from "@/generated/prisma/client";

/**
 * Minimum bar for appearing in Discover, Search people, and network highlights:
 * public, onboarded, at least one public READY knowledge source, plus bio or headline.
 */
export const qualifiedPublicHubProfileWhere = {
  visibility: "PUBLIC",
  isOnboarded: true,
  appearInExpertDiscovery: true,
  user: {
    knowledgeSources: {
      some: { isPublic: true, status: "READY" },
    },
  },
} satisfies Prisma.ProfileWhereInput;

export const qualifiedPublicKnowledgeSourceWhere = {
  isPublic: true,
  status: "READY" as const,
  organizationId: null,
  user: {
    profile: {
      visibility: "PUBLIC",
      isOnboarded: true,
    },
  },
} satisfies Prisma.KnowledgeSourceWhereInput;

export function profileHasDiscoverableHubCopy(profile: {
  bio: string | null;
  headline: string | null;
}): boolean {
  const bio = profile.bio?.trim() ?? "";
  const headline = profile.headline?.trim() ?? "";
  return bio.length > 0 || headline.length > 0;
}

export function isQualifiedPublicHubProfile(profile: {
  bio: string | null;
  headline: string | null;
  visibility?: string;
  isOnboarded?: boolean;
}): boolean {
  if (profile.visibility && profile.visibility !== "PUBLIC") return false;
  if (profile.isOnboarded === false) return false;
  return profileHasDiscoverableHubCopy(profile);
}
