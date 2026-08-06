"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { routeForOnboardingStep } from "@/config/onboarding-flow";
import type { OnboardingFlowStep } from "@/config/onboarding-flow";
import { ROUTES } from "@/config/constants";
import { clearOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";

export async function postOnboardingStep(
  step: OnboardingFlowStep,
  payload: Record<string, unknown> = {},
) {
  const response = await fetch("/api/v1/onboarding/step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, ...payload }),
  });
  const json: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error?: { message?: string } }).error?.message ===
        "string"
        ? (json as { error: { message: string } }).error.message
        : "Could not save progress";
    throw new Error(message);
  }
  const data =
    typeof json === "object" && json !== null && "data" in json
      ? (json as { data: { nextStep?: string | null; completed?: boolean } })
          .data
      : null;
  return data;
}

export function useOnboardingStepSubmit(step: OnboardingFlowStep) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function submit(payload: Record<string, unknown> = {}) {
    startTransition(async () => {
      try {
        const data = await postOnboardingStep(step, payload);
        if (data?.completed) {
          clearOnboardingDraft();
          router.push(ROUTES.hub.dashboard);
          router.refresh();
          return;
        }
        const next = data?.nextStep;
        if (next) {
          router.push(routeForOnboardingStep(next as OnboardingFlowStep));
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Something went wrong");
      }
    });
  }

  return { submit, isPending };
}
