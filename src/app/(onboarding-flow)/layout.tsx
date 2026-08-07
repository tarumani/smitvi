import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { resolveOnboardingRoute } from "@/application/onboarding/resolve-onboarding-route";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OnboardingFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect(ROUTES.login);
  }
  if (session.profile?.isOnboarded) {
    redirect(ROUTES.hub.dashboard);
  }
  return <>{children}</>;
}
