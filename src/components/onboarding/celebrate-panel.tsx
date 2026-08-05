"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

type CelebratePanelProps = {
  username: string;
};

export function CelebratePanel({ username }: CelebratePanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function finish() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/onboarding/complete", {
          method: "POST",
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
              : "Could not finish onboarding",
          );
        }
        toast.success("Your Intelligence Hub is live!");
        router.replace(ROUTES.hub.dashboard);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not finish onboarding",
        );
      }
    });
  }

  return (
    <div className="space-y-6 text-center">
      <p className="text-5xl" aria-hidden>
        🎉
      </p>
      <div>
        <h2 className="font-display text-2xl font-bold">You&apos;re live</h2>
        <p className="mt-2 text-[var(--muted-foreground)]">
          smitvi.com/@{username} is ready for chat, consults, and marketplace
          offers.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button type="button" onClick={finish} disabled={isPending}>
          Enter your hub
        </Button>
        <Button asChild variant="secondary">
          <Link href={ROUTES.publicProfile(username)}>View public page</Link>
        </Button>
      </div>
    </div>
  );
}
