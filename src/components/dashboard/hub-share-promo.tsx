"use client";

import { useState, useTransition } from "react";
import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { hubShareMessage, publicHubUrl } from "@/lib/public-hub-url";

type Props = {
  username: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  twinReady: boolean;
};

export function HubSharePromo({
  username,
  displayName,
  headline,
  avatarUrl,
  twinReady,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hubUrl = publicHubUrl(username);
  const message = hubShareMessage({ displayName, username, twinReady });
  const previewDescription =
    headline?.trim() ||
    (twinReady
      ? "Ask questions — answers stay grounded in their sources."
      : "Public Intelligence Hub on Smitvi.");

  function copyLink() {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        toast.success("Share message copied");
        window.setTimeout(() => setCopied(false), 2500);
        void fetch("/api/v1/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "PROFILE" }),
        });
      } catch {
        toast.error("Could not copy link");
      }
    });
  }

  function nativeShare() {
    startTransition(async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: `${displayName} on Smitvi`,
            text: message,
            url: hubUrl,
          });
          return;
        }
        await navigator.clipboard.writeText(message);
        toast.success("Share message copied");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        toast.error("Could not share");
      }
    });
  }

  return (
    <GlassCard className="p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--accent)]">Grow visits</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
            Share your public hub
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {twinReady
              ? "Send your @ link — when people visit, they can read your profile and chat with your Twin."
              : "Share your hub now; train your Twin so visitors get answers from your knowledge."}
          </p>

          <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] bg-[var(--accent-soft)]/30 px-4 py-2 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Link preview (Open Graph)
            </div>
            <div className="flex gap-4 p-4">
              <Avatar
                src={avatarUrl}
                name={displayName}
                className="h-14 w-14 shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--foreground)]">
                  {displayName} (@{username})
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                  {previewDescription}
                </p>
                <p className="mt-2 truncate text-xs text-[var(--muted)]">
                  smitvi.com/@{username}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-3 break-all rounded-lg bg-[var(--surface)]/80 px-3 py-2 font-mono text-xs text-[var(--muted-foreground)]">
            {hubUrl}
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-48">
          <Button
            type="button"
            disabled={isPending}
            onClick={copyLink}
            className="w-full"
          >
            <Link2 className="h-4 w-4" />
            {copied ? "Copied" : "Copy share text"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={nativeShare}
            className="w-full"
          >
            <Share2 className="h-4 w-4" />
            Share…
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
