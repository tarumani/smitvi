"use client";

import Link from "next/link";
import { MessageCircle, UserPlus } from "lucide-react";
import type { RankedExpertResult } from "@/domain/search/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

type Props = {
  expert: RankedExpertResult;
  query?: string;
  onOpenProfile?: (username: string) => void;
};

export function ExpertResultCard({ expert, query, onOpenProfile }: Props) {
  return (
    <GlassCard className="p-5">
      <div className="flex flex-wrap items-start gap-4">
        <Avatar
          src={expert.avatarUrl}
          name={expert.displayName}
          className="h-14 w-14"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={ROUTES.publicProfile(expert.username)}
              className="font-display text-lg font-semibold hover:text-[var(--accent)]"
              onClick={() => onOpenProfile?.(expert.username)}
            >
              {expert.displayName}
            </Link>
            <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">
              {expert.overallMatch}% match
            </span>
          </div>
          {expert.headline ? (
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {expert.headline}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-[var(--muted)]">
            Intelligence {expert.intelligencePoints} ·{" "}
            {expert.reputationScore > 0
              ? `Rep ${Math.round(expert.reputationScore)}`
              : "New expert"}
          </p>

          {expert.topSkills.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {expert.topSkills.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-[var(--border)] px-2 py-0.5 text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}

          {expert.whyMatch.length ? (
            <div className="mt-3 text-sm text-[var(--muted-foreground)]">
              <p className="font-medium text-[var(--foreground)]">Why this match?</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {expert.whyMatch.slice(0, 5).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {expert.unverifiedCriteria.length ? (
            <p className="mt-2 text-xs text-amber-600/90 dark:text-amber-400/90">
              {expert.unverifiedCriteria.slice(0, 2).join(" · ")}
            </p>
          ) : null}

          {expert.evidence.length ? (
            <details className="mt-3 text-xs text-[var(--muted-foreground)]">
              <summary className="cursor-pointer font-medium text-[var(--accent)]">
                View evidence
              </summary>
              <ul className="mt-2 space-y-1">
                {expert.evidence.slice(0, 4).map((ev) => (
                  <li key={ev.label}>
                    {ev.label}{" "}
                    {ev.verified ? "— verified" : "— not verified"}
                    {ev.excerpt ? `: ${ev.excerpt}` : ""}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[9rem]">
          <Button asChild size="sm" className="w-full">
            <Link
              href={ROUTES.publicProfile(expert.username)}
              onClick={() => onOpenProfile?.(expert.username)}
            >
              View Hub
            </Link>
          </Button>
          <Button asChild size="sm" variant="secondary" className="w-full">
            <Link href={ROUTES.publicTwinChat(expert.username)}>
              <MessageCircle className="h-3.5 w-3.5" />
              Ask AI
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="w-full">
            <Link href={ROUTES.publicProfile(expert.username)}>
              <UserPlus className="h-3.5 w-3.5" />
              Follow
            </Link>
          </Button>
        </div>
      </div>
      {query ? (
        <input type="hidden" data-search-query={query} aria-hidden />
      ) : null}
    </GlassCard>
  );
}
