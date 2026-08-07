import type { AuditLogRepository } from "@/domain/audit/ports";
import { ConflictError, UnauthorizedError, ValidationError } from "@/domain/shared/errors";
import type { ProfileEntity } from "@/domain/profile/entities";
import type { ProfileRepository } from "@/domain/profile/ports";
import { HUB_ARCHETYPES, type HubArchetypeId } from "@/config/brand";
import { parseCreateProfileInput } from "@/domain/profile/value-objects";

const validIds = new Set(HUB_ARCHETYPES.map((item) => item.id));

function suggestUsername(seed: string): string {
  return seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .slice(0, 24);
}

export class SaveOnboardingArchetype {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async execute(
    userId: string | null | undefined,
    rawInput: unknown,
    context?: { email?: string; referrerUsername?: string | null },
  ): Promise<ProfileEntity> {
    if (!userId) {
      throw new UnauthorizedError();
    }

    const hubArchetypeId =
      typeof rawInput === "object" &&
      rawInput !== null &&
      "hubArchetypeId" in rawInput &&
      typeof (rawInput as { hubArchetypeId?: string }).hubArchetypeId ===
        "string"
        ? (rawInput as { hubArchetypeId: string }).hubArchetypeId
        : null;

    if (!hubArchetypeId || !validIds.has(hubArchetypeId as HubArchetypeId)) {
      throw new ValidationError("Choose a valid hub archetype");
    }

    const existing = await this.profiles.findByUserId(userId);
    if (existing) {
      return this.profiles.update(userId, {
        hubArchetypeId,
        onboardingStep: "profile",
      });
    }

    const emailLocal = context?.email?.split("@")[0] ?? "creator";
    let username = suggestUsername(emailLocal) || "creator";
    if (username.length < 3) {
      username = `creator${userId.replace(/-/g, "").slice(0, 6)}`;
    }
    let attempt = 0;
    while (await this.profiles.usernameExists(username)) {
      attempt += 1;
      username = `${suggestUsername(emailLocal).slice(0, 20)}${attempt}`;
      if (attempt > 20) {
        throw new ConflictError("Could not reserve a username — try again");
      }
    }

    const input = parseCreateProfileInput({
      username,
      displayName: emailLocal.replace(/[._-]+/g, " ").trim() || "Creator",
      bio: null,
      headline: null,
      skills: [],
      socialLinks: [],
      portfolio: [],
      visibility: "PUBLIC",
      publicTwinEnabled: true,
      hubArchetypeId,
      onboardingStep: "profile",
    });

    const profile = await this.profiles.create(userId, input, {
      referrerUsername: context?.referrerUsername ?? null,
    });

    await this.auditLogs.create({
      actorId: userId,
      action: "PROFILE_CREATED",
      entityType: "profile",
      entityId: profile.id,
      metadata: {
        username: profile.username,
        hubArchetypeId,
        onboarding: true,
        referrerUsername: context?.referrerUsername ?? null,
      },
    });

    return profile;
  }
}
