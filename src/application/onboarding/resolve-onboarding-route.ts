import type { ProfileEntity, ProfileSummary } from "@/domain/profile/entities";
import { ROUTES } from "@/config/constants";

type ProfileLike = Pick<
  ProfileEntity | ProfileSummary,
  "isOnboarded" | "hubArchetypeId" | "username" | "onboardingStep"
> | null;

/** Next onboarding route for users who have not finished launch. */
export function resolveOnboardingRoute(profile: ProfileLike): string {
  if (!profile) {
    return ROUTES.onboardingIntelligence;
  }
  if (profile.isOnboarded) {
    return ROUTES.hub.dashboard;
  }
  return ROUTES.onboardingIntelligence;
}
