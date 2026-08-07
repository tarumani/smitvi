"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Copy, Mail, MessageCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import {
  expertInviteTemplate,
  mailtoInviteUrl,
  referralSignupUrl,
  whatsAppShareUrl,
  type ExpertInviteTemplateId,
} from "@/lib/referral";
import { cn } from "@/lib/utils";

const TEMPLATES: { id: ExpertInviteTemplateId; label: string }[] = [
  { id: "professional", label: "Professional email" },
  { id: "creator", label: "Creator / peer" },
  { id: "short", label: "Short DM" },
];

type Props = {
  username: string;
  displayName: string;
  referralCount: number;
  className?: string;
  compact?: boolean;
};

export function ExpertInvitePanel({
  username,
  displayName,
  referralCount,
  className,
  compact = false,
}: Props) {
  const [templateId, setTemplateId] =
    useState<ExpertInviteTemplateId>("professional");
  const [copied, setCopied] = useState<"message" | "link" | null>(null);
  const [isPending, startTransition] = useTransition();

  const link = referralSignupUrl(username);
  const message = useMemo(
    () => expertInviteTemplate(templateId, displayName, link),
    [templateId, displayName, link],
  );

  function copyText(text: string, kind: "message" | "link") {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(kind);
        toast.success(kind === "link" ? "Link copied" : "Message copied");
        window.setTimeout(() => setCopied(null), 2500);
      } catch {
        toast.error("Could not copy");
      }
    });
  }

  return (
    <GlassCard className={cn("p-6 sm:p-8", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <UserPlus className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-[var(--accent)] uppercase">
            Grow the network
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Invite 5–10 experts
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
            Real hubs make Discover, search, and your Human Intelligence Score
            stronger. Share your personal signup link — signups attribute to{" "}
            <span className="font-medium text-[var(--foreground)]">@{username}</span>.
          </p>
        </div>
      </div>

      {!compact ? (
        <ol className="mt-6 space-y-2 text-sm text-[var(--muted-foreground)]">
          <li>
            <span className="font-semibold text-[var(--foreground)]">1.</span> Pick
            a message tone below
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">2.</span> Send
            via WhatsApp, email, or LinkedIn DM
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">3.</span> Ask
            them to publish one knowledge source + a public hub
          </li>
        </ol>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplateId(t.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              templateId === t.id
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--foreground)]">
          {message}
        </pre>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => copyText(message, "message")}
        >
          <Copy className="h-4 w-4" />
          {copied === "message" ? "Copied" : "Copy message"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => copyText(link, "link")}
        >
          <Copy className="h-4 w-4" />
          {copied === "link" ? "Copied" : "Copy link only"}
        </Button>
        <Button type="button" variant="secondary" asChild>
          <a href={whatsAppShareUrl(message)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </Button>
        <Button type="button" variant="secondary" asChild>
          <a
            href={mailtoInviteUrl(
              `${displayName} invited you to Smitvi`,
              message,
            )}
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
        </Button>
      </div>

      <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        {referralCount > 0 ? (
          <>
            <span className="font-display text-2xl font-bold tabular-nums text-[var(--accent)]">
              {referralCount}
            </span>
            <span className="ml-2">
              attributed {referralCount === 1 ? "signup" : "signups"}
            </span>
          </>
        ) : (
          <span className="text-xs text-[var(--muted)]">
            No attributed signups yet — tracking only (no rewards program yet).
          </span>
        )}
      </p>

      {!compact ? (
        <p className="mt-6 text-center text-sm">
          <Link href={ROUTES.hub.dashboard} className="text-[var(--accent)] hover:underline">
            ← Back to dashboard
          </Link>
        </p>
      ) : null}
    </GlassCard>
  );
}
