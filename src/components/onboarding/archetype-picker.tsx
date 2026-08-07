"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HUB_ARCHETYPES } from "@/config/brand";
import { ROUTES } from "@/config/constants";
import { BusyOverlay, Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function ArchetypePicker() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function continueFlow() {
    if (!selected) {
      toast.error("Pick an archetype to continue");
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/onboarding/archetype", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hubArchetypeId: selected }),
        });
        const json: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            typeof json === "object" &&
              json !== null &&
              "error" in json &&
              typeof (json as { error?: { message?: string } }).error?.message ===
                "string"
              ? (json as { error: { message: string } }).error.message
              : "Could not save archetype",
          );
        }
        router.push(ROUTES.onboardingProfile);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not save archetype",
        );
      }
    });
  }

  return (
    <>
      <BusyOverlay active={isPending} label="Setting up your hub…" />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
          {HUB_ARCHETYPES.map((archetype) => {
            const active = selected === archetype.id;
            return (
              <button
                key={archetype.id}
                type="button"
                disabled={isPending}
                onClick={() => setSelected(archetype.id)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition-colors sm:py-3",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/40"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50",
                )}
              >
                <p className="text-sm font-semibold leading-tight">
                  {archetype.label}
                </p>
                <p className="mt-0.5 hidden text-[10px] leading-snug text-[var(--muted-foreground)] sm:block">
                  Hub voice & offers
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          {isPending ? (
            <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Spinner />
              Creating your profile…
            </p>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)]">
              {selected ? "Tap Continue when ready." : "Select one archetype to continue."}
            </p>
          )}
          <Button
            type="button"
            disabled={!selected || isPending}
            onClick={continueFlow}
            className="w-full sm:w-auto sm:shrink-0"
          >
            {isPending ? "Please wait…" : "Continue"}
          </Button>
        </div>
      </div>
    </>
  );
}
