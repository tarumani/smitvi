"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";
import {
  buildLaunchSteps,
  isLaunchWizardComplete,
  type LaunchStepId,
} from "@/components/dashboard/launch-wizard-steps";

type Props = {
  username: string;
  knowledgeCount: number;
  twinReady: boolean;
  consultationsEnabled: boolean;
  listingCount: number;
  initialStepId?: string | null;
};

const LAUNCH_STEP_IDS: LaunchStepId[] = [
  "profile",
  "knowledge",
  "twin",
  "book",
  "monetize",
];

function resolveStepIndex(
  steps: ReturnType<typeof buildLaunchSteps>,
  initialStepId: string | null | undefined,
): number {
  if (initialStepId && LAUNCH_STEP_IDS.includes(initialStepId as LaunchStepId)) {
    return steps.findIndex((s) => s.id === initialStepId);
  }
  const firstOpen = steps.findIndex((s) => !s.done);
  return firstOpen === -1 ? steps.length - 1 : firstOpen;
}

export function TwinLaunchWizard({
  username,
  knowledgeCount,
  twinReady,
  consultationsEnabled,
  listingCount,
  initialStepId,
}: Props) {
  const steps = useMemo(
    () =>
      buildLaunchSteps({
        username,
        knowledgeCount,
        twinReady,
        consultationsEnabled,
        listingCount,
      }),
    [
      username,
      knowledgeCount,
      twinReady,
      consultationsEnabled,
      listingCount,
    ],
  );

  const completed = steps.filter((s) => s.done).length;

  const [activeIndex, setActiveIndex] = useState(() =>
    resolveStepIndex(steps, initialStepId),
  );

  if (
    isLaunchWizardComplete({
      knowledgeCount,
      twinReady,
      consultationsEnabled,
      listingCount,
    })
  ) {
    return null;
  }

  const active = steps[activeIndex] ?? steps[0];
  const progressPct = Math.round((completed / steps.length) * 100);

  return (
    <GlassCard
      id="launch-wizard"
      className="scroll-mt-24 border-[var(--accent)]/30 p-6 sm:p-8"
    >
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

      <div className="mt-6 border-t border-[var(--border)] pt-6">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          All steps
        </p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Tap a row to focus it in the wizard above — work happens on linked
          pages; return here to track progress.
        </p>
        <ol className="mt-4 space-y-2">
          {steps.map((step, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition-colors sm:flex-row sm:items-center sm:justify-between",
                    isActive
                      ? "border-[var(--accent)]/50 bg-[var(--accent-soft)]/25"
                      : "border-[var(--border)] hover:border-[var(--accent)]/25",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {step.done ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--muted)]" />
                    )}
                    <p
                      className={
                        step.done
                          ? "text-sm font-medium text-[var(--foreground)]"
                          : "text-sm text-[var(--muted-foreground)]"
                      }
                    >
                      {step.listLabel}
                    </p>
                  </div>
                  {!step.done || step.id === "monetize" ? (
                    <Link
                      href={step.href}
                      onClick={(event) => event.stopPropagation()}
                      className="text-sm font-semibold text-[var(--accent)] hover:underline sm:shrink-0"
                    >
                      {step.action}
                    </Link>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </GlassCard>
  );
}
