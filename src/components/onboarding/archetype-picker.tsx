"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HUB_ARCHETYPES } from "@/config/brand";
import { ROUTES } from "@/config/constants";
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
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {HUB_ARCHETYPES.map((archetype) => {
          const active = selected === archetype.id;
          return (
            <button
              key={archetype.id}
              type="button"
              onClick={() => setSelected(archetype.id)}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition-colors",
                active
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50",
              )}
            >
              <p className="font-semibold">{archetype.label}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Shape your hub voice and offers
              </p>
            </button>
          );
        })}
      </div>
      <Button
        type="button"
        disabled={!selected || isPending}
        onClick={continueFlow}
        className="w-full sm:w-auto"
      >
        Continue
      </Button>
    </div>
  );
}
