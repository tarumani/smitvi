import {
  INCOMPLETE_ACTIVATION_STATUSES,
  evaluateActivation,
} from "@/domain/profile/activation";
import type { ProfileType } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

function parseJsonStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

export { parseJsonStringArray };

export function incompleteProfileUserWhere(): Prisma.UserWhereInput {
  return {
    OR: [
      { profile: { is: null } },
      {
        profile: {
          is: {
            activationStatus: { in: [...INCOMPLETE_ACTIVATION_STATUSES] },
          },
        },
      },
    ],
  };
}

export function incompleteProfileAutoBlockWhere(
  extras: Prisma.UserWhereInput[] = [],
): Prisma.UserWhereInput {
  return {
    deletedAt: null,
    plan: "FREE",
    role: { in: ["USER", "EXPERT"] },
    isBanned: false,
    marketplaceSales: { none: {} },
    ownedOrganizations: { none: {} },
    AND: [incompleteProfileUserWhere(), ...extras],
  };
}

export function missingActivationLabels(profile: {
  username?: string | null;
  profileType?: string | null;
  headline?: string | null;
  bio?: string | null;
  skillCount?: number;
  expertiseAreas?: unknown;
  industries?: unknown;
} | null): string[] {
  if (!profile) {
    return [
      "username",
      "profileType",
      "headlineOrSummary",
      "skills",
      "expertiseOrIndustry",
    ];
  }
  const expertise = parseJsonStringArray(profile.expertiseAreas);
  const industries = parseJsonStringArray(profile.industries);
  return evaluateActivation({
    username: profile.username,
    profileType: (profile.profileType as ProfileType | null) ?? null,
    headline: profile.headline,
    bio: profile.bio,
    confirmedSkillCount: profile.skillCount ?? 0,
    expertiseCount: expertise.length,
    industryCount: industries.length,
  }).missing;
}
