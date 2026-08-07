import type { ProfileEntity, ProfileSummary } from "@/domain/profile/entities";
import { ROUTES } from "@/config/constants";

type ProfileLike = Pick<
  ProfileEntity | ProfileSummary,
  "isOnboarded" | "hubArchetypeId" | "username" | "onboardingStep"
> | null;

/** Map v2 funnel step ids onto the classic 5-step flow. */
function normalizeClassicOnboardingStep(
  step: string | null | undefined,
): "archetype" | "profile" | "connect" | "build" | "celebrate" {
  if (!step) return "archetype";
  if (
    step === "archetype" ||
    step === "profile" ||
    step === "connect" ||
    step === "build" ||
    step === "celebrate"
  ) {
    return step;
  }
  if (step === "welcome" || step === "profession") return "archetype";
  if (step === "interests" || step === "photo" || step === "bio") return "profile";
  if (step === "knowledge") return "connect";
  if (step === "follow") return "build";
  if (step === "score") return "celebrate";
  return "connect";
}

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

  const step = normalizeClassicOnboardingStep(profile.onboardingStep);
  if (step === "celebrate") return ROUTES.onboardingCelebrate;
  if (step === "build") return ROUTES.onboardingBuild;
  if (step === "connect") return ROUTES.onboardingConnect;

  return ROUTES.onboardingConnect;
}
