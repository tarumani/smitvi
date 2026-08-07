"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConnectSourceGrid } from "@/components/knowledge/connect-source-grid";
import { OnboardingStepNav } from "@/components/onboarding/onboarding-step-nav";
import { ROUTES } from "@/config/constants";

export function ConnectSourcesForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function skipToBuild() {
    startTransition(async () => {
      try {
        await fetch("/api/v1/profiles/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboardingStep: "build" }),
        });
        router.push(ROUTES.onboardingBuild);
        router.refresh();
      } catch {
        router.push(ROUTES.onboardingBuild);
      }
    });
  }

  function afterImport() {
    router.push(ROUTES.onboardingBuild);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <ConnectSourceGrid
        mode="interactive"
        uploadAnchorId="onboarding-upload"
        onImported={afterImport}
      />

      <div
        id="onboarding-upload"
        className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm"
      >
        <p className="font-medium">Upload PDFs here</p>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Open your Intelligence Hub to drag and drop files, or continue after a
          link import above.
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-3">
          <a href={ROUTES.hub.intelligence}>Open intelligence hub</a>
        </Button>
      </div>

      <Button type="button" variant="ghost" onClick={skipToBuild} disabled={isPending}>
        Skip for now
      </Button>

      <OnboardingStepNav
        step="connect"
        onNext={skipToBuild}
        nextPending={isPending}
        nextLabel="Next"
      />
    </div>
  );
}
