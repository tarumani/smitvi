import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { GlassCard } from "@/components/ui/glass-card";
import { CelebratePanel } from "@/components/onboarding/celebrate-panel";
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
    <div className="mx-auto max-w-2xl space-y-6">
      <GlassCard className="p-8 sm:p-10">
        <CelebratePanel username={session.profile.username} />
      </GlassCard>
    </div>
  );
}
