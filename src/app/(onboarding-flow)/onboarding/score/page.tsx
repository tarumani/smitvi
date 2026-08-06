"use client";

import { motion } from "framer-motion";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingStepSubmit } from "@/components/onboarding/onboarding-step-actions";
import { INTELLIGENCE_POINT_WEIGHTS } from "@/config/onboarding-flow";

export default function OnboardingScorePage() {
  const { submit, isPending } = useOnboardingStepSubmit("score");

  return (
    <OnboardingShell
      step="score"
      title="Congratulations!"
      subtitle="Your Human Intelligence Profile is live."
      footer={
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit()}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--accent-foreground)]"
        >
          {isPending ? "Opening dashboard…" : "Go to dashboard"}
        </button>
      }
    >
      <div className="space-y-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-[var(--accent)] bg-[var(--accent-soft)] font-display text-3xl font-bold text-[var(--accent)]"
        >
          HI
        </motion.div>
        <p className="text-sm text-[var(--muted-foreground)]">
          Keep growing your score by uploading knowledge (+{INTELLIGENCE_POINT_WEIGHTS.knowledgeUpload} pts), following experts, and training your Twin.
        </p>
        <ul className="space-y-2 text-left text-sm">
          <li>✓ Profession & interests saved</li>
          <li>✓ Public hub started</li>
          <li>→ Upload knowledge next for the biggest boost</li>
        </ul>
      </div>
    </OnboardingShell>
  );
}
