import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { GlassCard } from "@/components/ui/glass-card";
import { BuildProgressAnimation } from "@/components/onboarding/build-progress";
import { OnboardingClassicLayout } from "@/components/onboarding/onboarding-classic-layout";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Building your Twin",
};

export default async function OnboardingBuildPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.username) {
    redirect(ROUTES.onboardingProfile);
  }

  return (
    <OnboardingClassicLayout active="build">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Building your Intelligence Hub
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            We&apos;re turning your sources into a living AI Twin.
          </p>
        </div>
        <GlassCard className="p-6 sm:p-8">
          <BuildProgressAnimation />
        </GlassCard>
      </div>
    </OnboardingClassicLayout>
  );
}
