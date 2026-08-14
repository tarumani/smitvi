import { prisma } from "@/infrastructure/database/prisma";
import { evaluateActivation } from "@/domain/profile/activation";
import { parseStringArray } from "@/application/onboarding/onboarding-helpers";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";

/** Existing users stay REGISTERED unless they already meet activation quality. */
export async function backfillActivationStatuses() {
  const profiles = await prisma.profile.findMany({
    select: {
      userId: true,
      username: true,
      profileType: true,
      headline: true,
      bio: true,
      expertiseAreas: true,
      industries: true,
      skills: { select: { id: true } },
    },
  });

  const service = new ProfileActivationService();
  let scanned = 0;
  let activated = 0;

  for (const profile of profiles) {
    scanned += 1;
    const qualifies = evaluateActivation({
      username: profile.username,
      profileType: profile.profileType,
      headline: profile.headline,
      bio: profile.bio,
      confirmedSkillCount: profile.skills.length,
      expertiseCount: parseStringArray(profile.expertiseAreas).length,
      industryCount: parseStringArray(profile.industries).length,
    });
    if (qualifies.activated) {
      await service.refresh(profile.userId);
      activated += 1;
    }
  }

  return { scanned, activated };
}
