"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Loader2, ThumbsDown, ThumbsUp, UserPlus, X } from "lucide-react";
import type { ExplainableRecommendation } from "@/domain/recommendations/types";
import { ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

type Props = {
  item: ExplainableRecommendation;
  compact?: boolean;
  onDismiss?: () => void;
};

export function RecommendationCard({ item, compact, onDismiss }: Props) {
  const track = useCallback(
    async (action: string) => {
      try {
        await fetch(
          `/api/recommendations/${encodeURIComponent(item.id)}/action`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, score: item.overallMatch }),
          },
        );
      } catch {
        /* non-blocking */
      }
    },
    [item.id, item.overallMatch],
  );

  const feedback = async (
    fb: "USEFUL" | "NOT_USEFUL" | "NOT_INTERESTED" | "ALREADY_KNOW" | "DISMISS",
  ) => {
    if (fb === "DISMISS" || fb === "NOT_INTERESTED") onDismiss?.();
    try {
      await fetch(
        `/api/recommendations/${encodeURIComponent(item.id)}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: fb }),
        },
      );
    } catch {
      /* non-blocking */
    }
  };

  const username =
    (item.metadata?.username as string | undefined) ?? item.expert?.username;
  const profileHref =
    item.targetType === "user" && username
      ? ROUTES.publicProfile(username)
      : null;

  return (
    <GlassCard className={cn("p-4", compact && "p-3")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--accent)]">
            {item.overallMatch}% match
          </p>
          <p className="mt-0.5 font-semibold leading-snug">{item.title}</p>
          {item.subtitle ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted-foreground)]">
              {item.subtitle}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="Dismiss"
          onClick={() => void feedback("DISMISS")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {item.breakdown ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)] sm:grid-cols-3">
          {Object.entries(item.breakdown).map(([k, v]) => (
            <div key={k}>
              <dt className="capitalize text-[var(--muted)]">
                {k.replace(/([A-Z])/g, " $1").trim()}
              </dt>
              <dd className="font-medium text-[var(--foreground)]">{v}%</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <p className="mt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
        <span className="font-medium text-[var(--foreground)]">
          Why am I seeing this?
        </span>{" "}
        {item.why[0]}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {profileHref ? (
          <Button
            asChild
            size="sm"
            variant="secondary"
            onClick={() => void track("profile_open")}
          >
            <Link href={profileHref}>View profile</Link>
          </Button>
        ) : null}
        {item.actions.includes("follow") ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void track("follow")}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Follow
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void feedback("USEFUL")}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          Useful
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void feedback("NOT_USEFUL")}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          Not useful
        </Button>
      </div>
    </GlassCard>
  );
}

export function RecommendationSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: ExplainableRecommendation[];
  empty?: string;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const visible = items.filter((item) => !dismissed.has(item.id));

  if (visible.length === 0) {
    if (items.length > 0) return null;
    return empty ? (
      <section>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">{empty}</p>
      </section>
    ) : null;
  }

  return (
    <section>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <ul className="mt-3 space-y-3">
        {visible.map((item) => (
          <li key={item.id}>
            <RecommendationCard
              item={item}
              onDismiss={() =>
                setDismissed((prev) => new Set(prev).add(item.id))
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ForYouFeedSkeleton() {
  return (
    <GlassCard className="flex items-center gap-2 p-6 text-sm text-[var(--muted-foreground)]">
      <Loader2 className="h-4 w-4 animate-spin" />
      Personalizing your feed…
    </GlassCard>
  );
}
