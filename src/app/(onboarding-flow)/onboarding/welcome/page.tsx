"use client";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingStepSubmit } from "@/components/onboarding/onboarding-step-actions";

export default function OnboardingWelcomePage() {
  const { submit, isPending } = useOnboardingStepSubmit("welcome");

  return (
    <OnboardingShell
      step="welcome"
      title="Welcome to Smitvi"
      subtitle="Let's build your Human Intelligence Profile. This takes less than 60 seconds."
      footer={
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit()}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-60"
        >
          {isPending ? "Starting…" : "Continue"}
        </button>
      }
    >
      <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
        <li>• One question at a time — no long forms</li>
        <li>• AI helps write your bio and Twin</li>
        <li>• Skip optional steps anytime</li>
      </ul>
    </OnboardingShell>
  );
}
