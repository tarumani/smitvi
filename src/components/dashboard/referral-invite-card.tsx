"use client";

import { useState, useTransition } from "react";
import { Copy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  referralInviteMessage,
  referralSignupUrl,
} from "@/lib/referral";

type Props = {
  username: string;
  displayName: string;
  referralCount: number;
};

export function ReferralInviteCard({
  username,
  displayName,
  referralCount,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const link = referralSignupUrl(username);
  const message = referralInviteMessage(displayName, link);

  function copyInvite() {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        toast.success("Invite copied");
        window.setTimeout(() => setCopied(false), 2500);
      } catch {
        toast.error("Could not copy invite");
      }
    });
  }

  return (
    <GlassCard className="flex h-full flex-col p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold tracking-wide text-[var(--accent)] uppercase">
          Grow Smitvi
        </p>
        <h2 className="mt-1 font-display text-lg font-bold tracking-tight sm:text-xl">
          Invite another expert
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Your link attributes signups to you and helps fill Discover with real
          hubs.
        </p>
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent-soft)]/50 to-[var(--surface)] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
            <UserPlus className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Join on Smitvi</p>
            <p className="mt-1 text-xs leading-snug text-[var(--muted-foreground)]">
              {displayName} invited you to train your AI Twin and sell what you
              know.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-[var(--border)]/80 bg-[var(--background)]/70 px-3 py-2">
          <p className="truncate font-mono text-[11px] text-[var(--foreground)] sm:text-xs">
            signup?ref={username}
          </p>
        </div>
      </div>

      {referralCount > 0 ? (
        <p className="mt-3 text-center text-sm text-[var(--muted-foreground)]">
          <span className="font-display text-2xl font-bold tabular-nums text-[var(--accent)]">
            {referralCount}
          </span>
          <span className="ml-2">
            {referralCount === 1 ? "creator joined" : "creators joined"}
          </span>
        </p>
      ) : (
        <p className="mt-3 text-center text-xs text-[var(--muted)]">
          No attributed signups yet — share your invite link below.
        </p>
      )}

      <Button
        type="button"
        disabled={isPending}
        onClick={copyInvite}
        className="mt-4 w-full"
        size="sm"
      >
        <Copy className="h-4 w-4" />
        {copied ? "Invite copied" : "Copy invite message"}
      </Button>

      <p className="mt-3 text-center text-[10px] leading-snug text-[var(--muted)]">
        Tracking only — no rewards program yet.
      </p>
    </GlassCard>
  );
}
