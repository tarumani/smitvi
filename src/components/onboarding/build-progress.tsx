"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

const STEPS = [
  "Scanning your sources",
  "Extracting expertise",
  "Chunking knowledge",
  "Embedding memories",
  "Summarizing your Twin",
] as const;

export function BuildProgressAnimation() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % STEPS.length);
    }, 2200);
    return () => window.clearInterval(tick);
  }, []);

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
        const ready = sources.filter((source) => source.status === "READY").length;
        const processing = sources.some(
          (source) =>
            source.status !== "READY" &&
            source.status !== "FAILED" &&
            source.status !== "PENDING",
        );
        if (cancelled) return;
        setReadyCount(ready);
        setTotal(sources.length);
        if (sources.length === 0 || ready > 0 || !processing) {
          setDone(true);
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
    <div className="space-y-8">
      <div className="relative h-2 overflow-hidden rounded-full bg-[var(--surface)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] transition-all duration-700"
          style={{
            width: done
              ? "100%"
              : `${Math.min(90, 20 + activeStep * 15)}%`,
          }}
        />
      </div>

      <ul className="space-y-3">
        {STEPS.map((label, index) => {
          const active = index === activeStep;
          return (
            <li
              key={label}
              className={
                active
                  ? "text-sm font-medium text-[var(--accent)]"
                  : "text-sm text-[var(--muted-foreground)]"
              }
            >
              {active ? "▸ " : "○ "}
              {label}
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-[var(--muted-foreground)]">
        {total === 0
          ? "No sources yet — you can still launch and train later."
          : `${readyCount} of ${total} sources ready`}
      </p>

      <Button type="button" onClick={continueToCelebrate} disabled={!done && total > 0 && readyCount === 0}>
        {done || total === 0 ? "Continue" : "Building…"}
      </Button>
    </div>
  );
}
