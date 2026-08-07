import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { GlassCard } from "@/components/ui/glass-card";
import { ConnectSourcesForm } from "@/components/onboarding/connect-sources-form";
import { OnboardingClassicLayout } from "@/components/onboarding/onboarding-classic-layout";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Connect sources",
};

export default async function OnboardingConnectPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.username) {
    redirect(ROUTES.onboardingProfile);
  }

  return (
    <OnboardingClassicLayout active="connect">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Connect your knowledge
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Connect LinkedIn, Notion, docs, and more — pick a source below.
          </p>
        </div>
        <GlassCard className="p-6 sm:p-8">
          <ConnectSourcesForm />
        </GlassCard>
      </div>
    </OnboardingClassicLayout>
  );
}
