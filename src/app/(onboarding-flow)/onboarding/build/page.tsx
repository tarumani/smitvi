import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { resolveOnboardingRoute } from "@/application/onboarding/resolve-onboarding-route";
import { ROUTES } from "@/config/constants";

/** Legacy build step — Twin training is post-launch from the dashboard. */
export default async function OnboardingBuildRedirect() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  redirect(resolveOnboardingRoute(session.profile));
}
