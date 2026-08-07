"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES, TRAIN_TWIN_LABEL } from "@/config/constants";
import { cn } from "@/lib/utils";

type Props = {
  username: string;
  knowledgeCount: number;
  twinReady: boolean;
  consultationsEnabled: boolean;
  listingCount: number;
};

type LaunchStep = {
  id: string;
  shortLabel: string;
  title: string;
  description: string;
  done: boolean;
  href: string;
  action: string;
};

export function TwinLaunchWizard({
  username,
  knowledgeCount,
  twinReady,
  consultationsEnabled,
  listingCount,
}: Props) {
  const steps: LaunchStep[] = useMemo(
    () => [
      {
        id: "profile",
        shortLabel: "Hub",
        title: "Your Intelligence Hub is live",
        description:
          "Your @username and public profile are set. Visitors can find you — next, give your Twin something to say.",
        done: true,
        href: ROUTES.publicProfile(username),
        action: "View public hub",
      },
      {
        id: "knowledge",
        shortLabel: "Train",
        title: "Upload your first knowledge source",
        description:
          "LinkedIn, Notion, PDFs, or pasted text — your Twin learns from what you already know.",
        done: knowledgeCount > 0,
        href: ROUTES.hub.intelligence,
        action: TRAIN_TWIN_LABEL,
      },
      {
        id: "twin",
        shortLabel: "Twin",
        title: "Get your Twin to Ready",
        description:
          "We process each source into answers with citations. When status shows READY, test chat on your hub.",
        done: twinReady,
        href: ROUTES.hub.intelligence,
        action: twinReady ? "Add more knowledge" : "Finish training",
      },
      {
        id: "book",
        shortLabel: "Book",
        title: "Enable the Book tab",
        description:
          "Let visitors request paid or free consultations from your public hub — alongside Twin chat.",
        done: consultationsEnabled,
        href: consultationsEnabled
          ? ROUTES.consultationSettings
          : ROUTES.consultationSetup,
        action: consultationsEnabled ? "Edit booking offer" : "Enable booking",
      },
      {
        id: "monetize",
        shortLabel: "Sell",
        title: "Publish a marketplace offer",
        description:
          "Package your expertise as a listing buyers can purchase — consultations, packs, or services.",
        done: listingCount > 0,
        href:
          listingCount > 0 ? ROUTES.hub.marketplace : ROUTES.marketplaceSellFirst,
        action: listingCount > 0 ? "Manage listings" : "Create listing",
      },
    ],
    [
      username,
      knowledgeCount,
      twinReady,
      consultationsEnabled,
      listingCount,
    ],
  );

  const completed = steps.filter((s) => s.done).length;
  const firstOpenIndex = steps.findIndex((s) => !s.done);
  const allCoreDone =
    steps[0].done &&
    steps[1].done &&
    steps[2].done &&
    steps[3].done &&
    listingCount > 0;

  const [activeIndex, setActiveIndex] = useState(() =>
    firstOpenIndex === -1 ? steps.length - 1 : firstOpenIndex,
  );

  useEffect(() => {
    if (firstOpenIndex === -1) return;
    setActiveIndex(firstOpenIndex);
  }, [firstOpenIndex]);

  if (allCoreDone) {
    return null;
  }

  const active = steps[activeIndex] ?? steps[0];
  const progressPct = Math.round((completed / steps.length) * 100);

  return (
    <GlassCard className="border-[var(--accent)]/30 p-6 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">
            Launch wizard
          </p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
            Path to revenue — step {activeIndex + 1} of {steps.length}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Complete each step to go from signup to a hub that earns.{" "}
            {completed} of {steps.length} done.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div
          className="h-2 overflow-hidden rounded-full bg-[var(--border)]"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <ol
        className="mt-5 flex gap-1 overflow-x-auto pb-1 sm:gap-2"
        aria-label="Launch steps"
      >
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          return (
            <li key={step.id} className="min-w-[4.5rem] flex-1">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition-colors sm:px-3",
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/40"
                    : "border-[var(--border)] bg-[var(--surface)]/60 hover:border-[var(--accent)]/30",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    step.done
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : isActive
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "bg-[var(--muted)]/20 text-[var(--muted)]",
                  )}
                >
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold leading-tight sm:text-xs",
                    isActive
                      ? "text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)]",
                  )}
                >
                  {step.shortLabel}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          {active.done ? (
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[var(--accent)]" />
          ) : (
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--accent-foreground)]">
              {activeIndex + 1}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-semibold tracking-tight">
              {active.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {active.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild>
                <Link href={active.href}>
                  {active.action}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {activeIndex < steps.length - 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setActiveIndex((i) => Math.min(i + 1, steps.length - 1))
                  }
                >
                  Next step
                </Button>
              ) : null}
              {activeIndex > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
                >
                  Previous
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
