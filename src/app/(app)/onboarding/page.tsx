import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { resolveOnboardingRoute } from "@/application/onboarding/resolve-onboarding-route";
import { ROUTES } from "@/config/constants";

export default async function OnboardingIndexPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect(ROUTES.login);
  }
  redirect(resolveOnboardingRoute(session.profile));
}
