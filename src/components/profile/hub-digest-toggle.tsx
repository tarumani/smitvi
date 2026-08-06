"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HubDigestToggleProps = {
  initialEnabled: boolean;
  className?: string;
};

export function HubDigestToggle({
  initialEnabled,
  className,
}: HubDigestToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const next = !enabled;
      try {
        const response = await fetch("/api/v1/profiles/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hubDigestEmailEnabled: next }),
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
              : "Could not update email preference";
          throw new Error(message);
        }
        setEnabled(next);
        toast.success(
          next
            ? "Weekly hub digest emails enabled"
            : "Hub digest emails turned off",
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not save preference",
        );
      }
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={enabled ? "secondary" : "ghost"}
      className={cn(className)}
      disabled={isPending}
      onClick={toggle}
    >
      {isPending
        ? "Saving…"
        : enabled
          ? "Digest emails on"
          : "Digest emails off"}
    </Button>
  );
}
