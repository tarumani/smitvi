"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ManageBillingButton() {
  const [isPending, startTransition] = useTransition();

  function openPortal() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/billing/portal", {
          method: "POST",
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
              : "Could not open billing portal";
          throw new Error(message);
        }
        const url = (json as { data: { url: string } }).data.url;
        window.location.href = url;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not open billing portal",
        );
      }
    });
  }

  return (
    <Button variant="secondary" onClick={openPortal} disabled={isPending}>
      {isPending ? "Opening…" : "Manage in Stripe"}
    </Button>
  );
}
