"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/config/constants";

export function ConnectSourcesForm() {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  function importWebsite(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/import-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "WEBSITE", sourceUrl: websiteUrl.trim() }),
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
              : "Import failed",
          );
        }
        toast.success("Website import started");
        router.push(ROUTES.onboardingBuild);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Import failed");
      }
    });
  }

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

  return (
    <div className="space-y-6">
      <form onSubmit={importWebsite} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input
            id="websiteUrl"
            type="url"
            placeholder="https://yoursite.com/about"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            required
          />
          <p className="text-xs text-[var(--muted-foreground)]">
            We fetch public page text to train your Twin (simple HTML strip).
          </p>
        </div>
        <Button type="submit" disabled={isPending}>
          Import website
        </Button>
      </form>

      <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm">
        <p className="font-medium">Prefer documents?</p>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Upload PDFs anytime from your intelligence workspace.
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-3">
          <Link href={ROUTES.hub.intelligence}>Open intelligence hub</Link>
        </Button>
      </div>

      <Button type="button" variant="ghost" onClick={skipToBuild} disabled={isPending}>
        Skip for now
      </Button>
    </div>
  );
}
