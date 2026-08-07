import type { ProfileEntity, ProfileSummary } from "@/domain/profile/entities";
import { ROUTES } from "@/config/constants";

type ProfileLike = Pick<
  ProfileEntity | ProfileSummary,
  "isOnboarded" | "hubArchetypeId" | "username" | "onboardingStep"
> | null;

/** Fast onboarding: archetype → profile → launch (train Twin later from dashboard). */
function normalizeClassicOnboardingStep(
  step: string | null | undefined,
): "archetype" | "profile" | "celebrate" {
  if (!step) return "archetype";
  if (step === "archetype" || step === "profile" || step === "celebrate") {
    return step;
  }
  if (
    step === "welcome" ||
    step === "profession" ||
    step === "interests" ||
    step === "photo" ||
    step === "bio"
  ) {
    return "profile";
  }
  if (
    step === "connect" ||
    step === "build" ||
    step === "knowledge" ||
    step === "follow" ||
    step === "score"
  ) {
    return "celebrate";
  }
  return "profile";
}

/** Next onboarding route for users who have not finished launch. */
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

  const step = normalizeClassicOnboardingStep(profile.onboardingStep);
  if (step === "celebrate") {
    return ROUTES.onboardingCelebrate;
  }
  if (step === "profile") {
    return ROUTES.onboardingProfile;
  }

  return ROUTES.onboardingCelebrate;
}
