"use client";

import { ConnectSourceGrid } from "@/components/knowledge/connect-source-grid";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingStepSubmit } from "@/components/onboarding/onboarding-step-actions";

export default function OnboardingKnowledgePage() {
  const { submit, isPending } = useOnboardingStepSubmit("knowledge");

  return (
    <OnboardingShell
      step="knowledge"
      title="Upload your knowledge"
      subtitle="Our AI builds your Intelligence Profile from docs, links, and files."
      footer={
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit({ skip: true })}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--accent-foreground)]"
        >
          {isPending ? "Saving…" : "Continue"}
        </button>
      }
    >
      <p className="mb-4 text-sm text-[var(--muted-foreground)]">
        Add at least one source now, or skip and train your Twin from the
        dashboard.
      </p>
      <ConnectSourceGrid mode="interactive" uploadAnchorId="onboarding-knowledge-upload" />
      <div id="onboarding-knowledge-upload" className="sr-only" />
    </OnboardingShell>
  );
}
