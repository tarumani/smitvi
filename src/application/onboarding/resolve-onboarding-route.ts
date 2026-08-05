import type { ProfileEntity, ProfileSummary } from "@/domain/profile/entities";
import { ROUTES } from "@/config/constants";

type ProfileLike = Pick<
  ProfileEntity | ProfileSummary,
  "isOnboarded" | "hubArchetypeId" | "username" | "onboardingStep"
> | null;

/** Next onboarding step for authenticated users who have not finished celebrate. */
export function resolveOnboardingRoute(profile: ProfileLike): string {
  if (!profile) {
    return ROUTES.onboardingArchetype;
  }
  if (profile.isOnboarded) {
    return ROUTES.hub.dashboard;
  }
  if (!profile.hubArchetypeId) {
    return ROUTES.onboardingArchetype;
  }
  if (!profile.username?.trim()) {
    return ROUTES.onboardingProfile;
  }

  const step = profile.onboardingStep;
  if (step === "celebrate") return ROUTES.onboardingCelebrate;
  if (step === "build") return ROUTES.onboardingBuild;
  if (step === "connect") return ROUTES.onboardingConnect;

  return ROUTES.onboardingConnect;
}
