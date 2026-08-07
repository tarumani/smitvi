"use client";

import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

export function ImportLoadingOverlay({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--surface)]/92 px-6 text-center backdrop-blur-[2px]",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-9 w-9 animate-spin text-[var(--accent)]" />
      <div>
        <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Fetching and indexing content — often 15–60 seconds
        </p>
      </div>
    </div>
  );
}

export function ImportSuccessPanel({
  sourceLabel,
  onDismiss,
}: {
  sourceLabel: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-[var(--accent)]/35 bg-[var(--accent-soft)]/25 p-4"
      role="status"
    >
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {sourceLabel} added to training sources
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Scroll down to see status. When it shows{" "}
            <span className="font-medium text-[var(--foreground)]">READY</span>,
            open Twin Chat and ask a question only you would know.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href={ROUTES.twinChat}>Test your Twin</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href="#training-sources-list">View sources</a>
            </Button>
            {onDismiss ? (
              <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImportErrorHint({
  message,
  showPasteFallback,
}: {
  message: string;
  showPasteFallback?: boolean;
}) {
  return (
    <div
      className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-[var(--foreground)]"
      role="alert"
    >
      <p className="font-medium text-red-600 dark:text-red-400">Import failed</p>
      <p className="mt-1 text-[var(--muted-foreground)]">{message}</p>
      {showPasteFallback ? (
        <p className="mt-2 text-xs font-medium text-[var(--accent)]">
          ↓ Paste your profile text below — this works when LinkedIn blocks
          automatic import.
        </p>
      ) : null}
    </div>
  );
}

export function scrollToTrainingSources() {
  window.setTimeout(() => {
    document.getElementById("training-sources")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 150);
}

export function scrollToElement(id: string) {
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 150);
}
