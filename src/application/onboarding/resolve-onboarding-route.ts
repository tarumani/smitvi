import {
  normalizeOnboardingStep,
  routeForOnboardingStep,
} from "@/config/onboarding-flow";
import { ROUTES } from "@/config/constants";
import type { ProfileEntity, ProfileSummary } from "@/domain/profile/entities";

type ProfileLike = Pick<
  ProfileEntity | ProfileSummary,
  "isOnboarded" | "username" | "onboardingStep"
> | null;

/** Next onboarding step for authenticated users who have not finished activation. */
export function resolveOnboardingRoute(profile: ProfileLike): string {
  if (!profile) {
    return routeForOnboardingStep("welcome");
  }
  if (profile.isOnboarded) {
    return ROUTES.hub.dashboard;
  }

  const step = normalizeOnboardingStep(profile.onboardingStep);
  if (step === "score") {
    return routeForOnboardingStep("score");
  }
  if (!profile.username?.trim() && step !== "welcome" && step !== "profession") {
    return routeForOnboardingStep("bio");
  }

  return routeForOnboardingStep(step);
}
