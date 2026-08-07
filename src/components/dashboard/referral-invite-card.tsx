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
    <GlassCard className="p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--accent)]">Grow Smitvi</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
            Invite another expert
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Share your signup link. When they create a Twin and publish, Smitvi
            gets more real content for Discover and search.
          </p>
          <p className="mt-3 break-all rounded-lg bg-[var(--surface)]/80 px-3 py-2 font-mono text-xs text-[var(--muted-foreground)]">
            {link}
          </p>
          {referralCount > 0 ? (
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              <span className="font-semibold text-[var(--foreground)] tabular-nums">
                {referralCount}
              </span>{" "}
              {referralCount === 1 ? "creator signed up" : "creators signed up"}{" "}
              with your link.
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          disabled={isPending}
          onClick={copyInvite}
          className="w-full shrink-0 sm:w-48"
        >
          {copied ? (
            "Copied"
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy invite
            </>
          )}
        </Button>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
        <UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Attribution is stored when they finish signup — no rewards program yet,
        just tracking who you brought in.
      </p>
    </GlassCard>
  );
}
