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
    <GlassCard className="flex h-full flex-col p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold tracking-wide text-[var(--accent)] uppercase">
          Grow visits
        </p>
        <h2 className="mt-1 font-display text-lg font-bold tracking-tight sm:text-xl">
          Share your public hub
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {twinReady
            ? "Visitors can read your profile and chat with your Twin."
            : "Share now; train your Twin so visitors get real answers."}
        </p>
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]/80">
        <div className="border-b border-[var(--border)] px-3 py-1.5 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
          Link preview
        </div>
        <div className="flex gap-3 p-3">
          <Avatar
            src={avatarUrl}
            name={displayName}
            className="h-12 w-12 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-[var(--muted)]">@{username}</p>
            <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-[var(--muted-foreground)]">
              {previewDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2">
        <p className="truncate font-mono text-[11px] text-[var(--muted-foreground)] sm:text-xs">
          {hubUrl}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          type="button"
          disabled={isPending}
          onClick={copyLink}
          className="w-full"
          size="sm"
        >
          <Link2 className="h-4 w-4" />
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={nativeShare}
          className="w-full"
          size="sm"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </GlassCard>
  );
}
