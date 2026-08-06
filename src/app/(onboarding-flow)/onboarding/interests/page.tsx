"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingStepSubmit } from "@/components/onboarding/onboarding-step-actions";
import { ONBOARDING_INTERESTS } from "@/config/onboarding-flow";
import { saveOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";

export default function OnboardingInterestsPage() {
  const [picked, setPicked] = useState<string[]>([]);
  const { submit, isPending } = useOnboardingStepSubmit("interests");

  function toggle(interest: string) {
    setPicked((current) =>
      current.includes(interest)
        ? current.filter((i) => i !== interest)
        : [...current, interest],
    );
  }

  return (
    <OnboardingShell
      step="interests"
      title="What are you into?"
      subtitle="Pick at least 3 — we'll match you with experts and topics."
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={picked.length < 3 || isPending}
            onClick={() => {
              saveOnboardingDraft({ interests: picked });
              submit({ interests: picked });
            }}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
          >
            {isPending ? "Saving…" : `Continue (${picked.length}/3+)`}
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2">
        {ONBOARDING_INTERESTS.map((interest) => {
          const active = picked.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggle(interest)}
              className={cn(
                "rounded-full border px-3 py-2 text-xs font-medium sm:text-sm",
                active
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)]",
              )}
            >
              {interest}
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
