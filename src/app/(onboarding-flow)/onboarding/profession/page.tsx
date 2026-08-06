"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingStepSubmit } from "@/components/onboarding/onboarding-step-actions";
import { ONBOARDING_PROFESSIONS } from "@/config/onboarding-flow";
import { saveOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";

export default function OnboardingProfessionPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const { submit, isPending } = useOnboardingStepSubmit("profession");

  return (
    <OnboardingShell
      step="profession"
      title="What best describes you?"
      subtitle="We'll tailor your Human Intelligence Profile and AI Twin."
      footer={
        <button
          type="button"
          disabled={!selected || isPending}
          onClick={() => {
            if (!selected) return;
            saveOnboardingDraft({ profession: selected });
            submit({ professionId: selected });
          }}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Continue"}
        </button>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {ONBOARDING_PROFESSIONS.map((item) => {
          const active = selected === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item.id)}
              className={cn(
                "rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
                active
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] hover:border-[var(--accent)]/40",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
