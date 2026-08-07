"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ROUTES } from "@/config/constants";

const STEPS = [
  "Scanning your sources",
  "Extracting expertise",
  "Chunking knowledge",
  "Embedding memories",
  "Summarizing your Twin",
] as const;

type Phase = "idle" | "processing" | "ready";

export function BuildProgressAnimation() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");

  const isAnimating = phase === "processing";

  useEffect(() => {
    if (!isAnimating) return;
    const tick = window.setInterval(() => {
      setActiveStep((current) =>
        current >= STEPS.length - 1 ? current : current + 1,
      );
    }, 2200);
    return () => window.clearInterval(tick);
  }, [isAnimating]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch("/api/v1/knowledge");
        if (!response.ok) return;
        const json = (await response.json()) as {
          sources?: Array<{ status: string }>;
        };
        const sources = json.sources ?? [];
        if (cancelled) return;

        if (sources.length === 0) {
          setTotal(0);
          setReadyCount(0);
          setPhase("idle");
          return;
        }

        const ready = sources.filter((source) => source.status === "READY").length;
        const processing = sources.some(
          (source) =>
            source.status !== "READY" &&
            source.status !== "FAILED" &&
            source.status !== "PENDING",
        );
        setReadyCount(ready);
        setTotal(sources.length);

        if (ready > 0) {
          setPhase("ready");
          setActiveStep(STEPS.length - 1);
        } else if (processing) {
          setPhase("processing");
        } else {
          setPhase("idle");
        }
      } catch {
        /* retry on next interval */
      }
    }

    poll();
    const interval = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const barPercent = useMemo(() => {
    if (phase === "ready") return 100;
    if (phase === "processing") {
      return Math.round(((activeStep + 1) / STEPS.length) * 85);
    }
    return 12;
  }, [phase, activeStep]);

  const canContinue =
    phase === "ready" || phase === "idle" || (total > 0 && readyCount > 0);

  async function continueToCelebrate() {
    await fetch("/api/v1/profiles/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingStep: "celebrate" }),
    });
    router.push(ROUTES.onboardingCelebrate);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-3">
        {phase === "processing" ? (
          <Spinner label="Training your Twin…" />
        ) : phase === "ready" ? (
          <p className="text-sm font-medium text-[var(--accent)]">
            Twin training complete
          </p>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            No sources yet — you can continue and train later.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-[var(--muted)]">
          <span>Build progress</span>
          <span>{barPercent}%</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-[var(--surface)]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] transition-all duration-700"
            style={{ width: `${barPercent}%` }}
          />
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          {phase === "processing"
            ? "The bar tracks the current training stage — not finished until your sources are Ready."
            : phase === "ready"
              ? "All set — continue to launch your hub."
              : "Connect sources on the previous step to see live training here."}
        </p>
      </div>

      <ul className="space-y-3">
        {STEPS.map((label, index) => {
          const complete = phase === "ready" || index < activeStep;
          const active = phase === "processing" && index === activeStep;
          return (
            <li
              key={label}
              className={
                active
                  ? "text-sm font-medium text-[var(--accent)]"
                  : complete
                    ? "text-sm text-[var(--foreground)]"
                    : "text-sm text-[var(--muted-foreground)]"
              }
            >
              {complete ? "✓ " : active ? "▸ " : "○ "}
              {label}
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-[var(--muted-foreground)]">
        {total === 0
          ? "Skip ahead anytime — add knowledge from your dashboard."
          : `${readyCount} of ${total} sources ready`}
      </p>

      <Button type="button" onClick={continueToCelebrate} disabled={!canContinue}>
        {phase === "processing" && total > 0 && readyCount === 0
          ? "Building…"
          : "Continue"}
      </Button>
    </div>
  );
}
