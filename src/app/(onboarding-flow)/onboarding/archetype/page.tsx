import type { Metadata } from "next";
import { GlassCard } from "@/components/ui/glass-card";
import { ArchetypePicker } from "@/components/onboarding/archetype-picker";
import { OnboardingClassicLayout } from "@/components/onboarding/onboarding-classic-layout";
import { APP_OUTCOME } from "@/config/constants";

export const metadata: Metadata = {
  title: "Choose archetype",
};

export default function OnboardingArchetypePage() {
  return (
    <OnboardingClassicLayout active="archetype">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            What kind of hub are you building?
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            {APP_OUTCOME} Pick an archetype — you can refine everything later.
          </p>
        </div>
        <GlassCard className="p-6 sm:p-8">
          <ArchetypePicker />
        </GlassCard>
      </div>
    </OnboardingClassicLayout>
  );
}
