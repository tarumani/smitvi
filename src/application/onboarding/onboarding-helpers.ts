import { prisma } from "@/infrastructure/database/prisma";
import { container } from "@/application/container";
import { UnauthorizedError, ValidationError } from "@/domain/shared/errors";
import type { AuditAction } from "@/generated/prisma/client";

export async function ensureOnboardingProfile(userId: string, email: string) {
  const existing = await container.profiles.findByUserId(userId);
  if (existing) return existing;

  const base =
    email
      .split("@")[0]
      ?.replace(/[^a-z0-9]/gi, "")
      .toLowerCase()
      .slice(0, 20) || "member";
  let username = base;
  let suffix = 0;
  while (await container.profiles.usernameExists(username)) {
    suffix += 1;
    username = `${base}${suffix}`;
  }

  return container.profiles.create(userId, {
    username,
    displayName: base,
    visibility: "PUBLIC",
    publicTwinEnabled: true,
    skills: [],
    socialLinks: [],
    portfolio: [],
    onboardingStep: "ai_welcome",
  });
}

export async function trackProfileEvent(
  userId: string,
  action: AuditAction,
  metadata?: Record<string, unknown>,
) {
  await container.auditLogs.create({
    actorId: userId,
    action,
    entityType: "profile",
    entityId: userId,
    metadata: metadata ?? {},
  });
}

export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function requireOwnedProfile(userId: string) {
  if (!userId) throw new UnauthorizedError();
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      skills: { include: { skill: true } },
      experiences: true,
      portfolio: true,
    },
  });
  if (!profile) throw new ValidationError("Profile not found");
  return profile;
}
