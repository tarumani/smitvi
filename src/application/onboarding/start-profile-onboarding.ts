import { prisma } from "@/infrastructure/database/prisma";
import {
  PROFILE_TYPE_TO_ARCHETYPE,
  PROFILE_TYPES,
  type ProfileTypeId,
} from "@/domain/profile/activation";
import { ValidationError } from "@/domain/shared/errors";
import {
  ensureOnboardingProfile,
  trackProfileEvent,
} from "@/application/onboarding/onboarding-helpers";

export class StartProfileOnboarding {
  async execute(userId: string, email: string) {
    await ensureOnboardingProfile(userId, email);
    const row = await prisma.profile.findUnique({ where: { userId } });
    await prisma.profile.update({
      where: { userId },
      data: {
        onboardingStep: "ai_type",
        activationStatus:
          !row || row.activationStatus === "REGISTERED"
            ? "ONBOARDING_STARTED"
            : row.activationStatus,
      },
    });
    await trackProfileEvent(userId, "PROFILE_ONBOARDING_STARTED", {});
    return { step: "ai_type" };
  }
}

export class SetProfileType {
  async execute(userId: string, email: string, type: string) {
    if (!PROFILE_TYPES.includes(type as ProfileTypeId)) {
      throw new ValidationError("Invalid profile type");
    }
    const profileType = type as ProfileTypeId;
    await ensureOnboardingProfile(userId, email);
    await prisma.profile.update({
      where: { userId },
      data: {
        profileType,
        hubArchetypeId: PROFILE_TYPE_TO_ARCHETYPE[profileType],
        onboardingStep: "ai_tell",
        activationStatus: "ONBOARDING_STARTED",
      },
    });
    await trackProfileEvent(userId, "PROFILE_TYPE_SELECTED", { profileType });
    return { profileType };
  }
}
