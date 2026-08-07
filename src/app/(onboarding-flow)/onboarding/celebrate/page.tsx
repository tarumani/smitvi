import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { GlassCard } from "@/components/ui/glass-card";
import { CelebratePanel } from "@/components/onboarding/celebrate-panel";
import { OnboardingClassicLayout } from "@/components/onboarding/onboarding-classic-layout";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Celebrate",
};

export default async function OnboardingCelebratePage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.username) {
    redirect(ROUTES.onboardingProfile);
  }

  return (
    <OnboardingClassicLayout active="celebrate">
      <GlassCard className="p-8 sm:p-10">
        <CelebratePanel username={session.profile.username} />
      </GlassCard>
    </OnboardingClassicLayout>
  );
}
