import { redirect } from "next/navigation";
import { routeForOnboardingStep } from "@/config/onboarding-flow";

/** Profile photo step removed — send legacy links to bio. */
export default function OnboardingPhotoRedirectPage() {
  redirect(routeForOnboardingStep("bio"));
}
