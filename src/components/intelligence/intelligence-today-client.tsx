"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import type { IntelligenceUpdateItem } from "@/domain/intelligence/update-extraction";

type TodayPayload = {
  greetingName: string;
  readiness: { score: number; level: string; weekDelta: number; missing: string[] };
  primaryAction: {
    id: string;
    type: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    expectedImpact: { intelligenceReadiness: number };
    href: string;
    cta: string;
  };
  secondaryActions: Array<{ id: string; title: string; href: string }>;
  challenge: { title: string; description: string; href: string } | null;
  relevant: {
    people: Array<{ id: string; title: string; why: string[]; targetId: string }>;
    knowledge: Array<{ id: string; title: string; why: string[] }>;
    opportunities: Array<{ id: string; title: string; why: string[] }>;
    twinActivity: boolean;
  };
  twin: {
    questionsAnswered: number;
    confidencePct: number;
    coverage: string;
    topics: string[];
    suggestion: string;
  };
  consistency: { monthUpdates: number; weekUpdates: number };
  search: { searches: number; visits: number };
  monetization: { title: string; href: string; cta: string } | null;
};

function hourGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function IntelligenceTodayClient() {
  const [data, setData] = useState<TodayPayload | null>(null);
  const [timeline, setTimeline] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
  const [narrative, setNarrative] = useState("");
  const [items, setItems] = useState<Array<IntelligenceUpdateItem & { selected: boolean }>>([]);
  const [mode, setMode] = useState<"idle" | "update" | "teach">("idle");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<{
    summary: string;
    metricsSnapshot: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("update")) setMode("update");
    if (params.get("teach")) setMode("teach");
    void Promise.all([
      fetch("/api/v1/intelligence/today").then((r) => r.json()),
      fetch("/api/v1/intelligence/timeline").then((r) => r.json()),
      fetch("/api/v1/intelligence/weekly-report").then((r) => r.json()),
    ]).then(([today, tl, wr]) => {
      if (today.data) setData(today.data as TodayPayload);
      if (tl.data?.items) setTimeline(tl.data.items);
      if (wr.data?.report) setReport(wr.data.report);
    });
  }, []);

  const hour = useMemo(() => hourGreeting(), []);

  async function analyze() {
    setBusy(true);
    try {
      const url =
        mode === "teach"
          ? "/api/v1/twin/teach"
          : "/api/v1/intelligence/update/analyze";
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrative }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "Could not analyze");
      const extraction = json.data.extraction as {
        items: IntelligenceUpdateItem[];
      };
      setItems(
        (extraction.items ?? []).map((item) => ({
          ...item,
          selected: item.classification === "EXPLICIT",
        })),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    try {
      const response = await fetch("/api/v1/intelligence/update/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative,
          visibility: "PROFILE",
          teachTwin: mode === "teach",
          items,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "Could not save");
      toast.success("Intelligence updated");
      setMode("idle");
      setItems([]);
      setNarrative("");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function complete(id: string) {
    await fetch(`/api/v1/intelligence/action/${id}/complete`, { method: "POST" });
  }

  async function dismiss(id: string) {
    await fetch(`/api/v1/intelligence/action/${id}/dismiss`, { method: "POST" });
    toast.message("We’ll suggest something else next time.");
    window.location.reload();
  }

  if (!data) {
    return <p className="text-sm text-[var(--muted)]">Loading your intelligence…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          {hour}, {data.greetingName}
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Your Intelligence is growing.
        </p>
      </div>

      <GlassCard className="p-6">
        <p className="text-sm text-[var(--muted)]">Intelligence Readiness</p>
        <p className="mt-1 font-display text-4xl font-bold">
          {data.readiness.score}{" "}
          <span className="text-lg text-[var(--muted)]">/ 100</span>
        </p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {data.readiness.weekDelta >= 0 ? "+" : ""}
          {data.readiness.weekDelta} this week
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
          <div
            className="h-full bg-[var(--accent)]"
            style={{ width: `${data.readiness.score}%` }}
          />
        </div>
      </GlassCard>

      <GlassCard className="border-[var(--accent)]/30 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
          Today&apos;s best action
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold">
          {data.primaryAction.title}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {data.primaryAction.description}
        </p>
        <p className="mt-3 text-sm">
          Estimated time: {data.primaryAction.estimatedMinutes} minutes
          {data.primaryAction.expectedImpact.intelligenceReadiness
            ? ` · about +${data.primaryAction.expectedImpact.intelligenceReadiness} readiness`
            : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild onClick={() => void complete(data.primaryAction.id)}>
            <Link href={data.primaryAction.href}>{data.primaryAction.cta}</Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => void dismiss(data.primaryAction.id)}
          >
            Not now
          </Button>
          <Button variant="secondary" onClick={() => setMode("update")}>
            Update my intelligence
          </Button>
        </div>
      </GlassCard>

      {mode !== "idle" ? (
        <GlassCard className="space-y-4 p-6">
          <h2 className="font-display text-xl font-semibold">
            {mode === "teach" ? "Teach your AI Twin" : "One-minute intelligence update"}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {mode === "teach"
              ? "What should your Twin know about you?"
              : "What did you work on, learn, build, discover, or achieve recently?"}
          </p>
          <textarea
            className="w-full rounded-xl border border-[var(--border)] bg-transparent p-3 text-sm"
            rows={5}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="I redesigned a checkout experience for an e-commerce app."
          />
          <Button onClick={() => void analyze()} disabled={busy || !narrative.trim()}>
            Analyze
          </Button>
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item, index) => (
                <label key={`${item.value}-${index}`} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, selected: e.target.checked } : row,
                        ),
                      )
                    }
                  />
                  <span>
                    <span className="font-medium">{item.category}:</span> {item.value}{" "}
                    <span className="text-[var(--muted)]">
                      ({item.classification.toLowerCase()})
                    </span>
                  </span>
                </label>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void confirm()} disabled={busy}>
                  Confirm selected
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setItems((prev) => prev.map((i) => ({ ...i, selected: true })))
                  }
                >
                  Select all
                </Button>
                <Button variant="ghost" onClick={() => setItems([])}>
                  Discard
                </Button>
              </div>
            </div>
          ) : null}
        </GlassCard>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h3 className="font-semibold">Relevant for you</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {data.relevant.people.slice(0, 3).map((p) => (
              <li key={p.id}>
                <p className="font-medium">{p.title}</p>
                <p className="text-[var(--muted-foreground)]">
                  {p.why[0] ?? "Matches your expertise"}
                </p>
                <Link className="text-[var(--accent)]" href={ROUTES.discover}>
                  View profile
                </Link>
              </li>
            ))}
            {data.relevant.knowledge.slice(0, 2).map((k) => (
              <li key={k.id}>
                <p className="font-medium">{k.title}</p>
                <p className="text-[var(--muted-foreground)]">
                  {k.why[0] ?? "Matches your interests"}
                </p>
              </li>
            ))}
            {data.relevant.opportunities[0] ? (
              <li>
                <p className="font-medium">{data.relevant.opportunities[0].title}</p>
                <p className="text-[var(--muted-foreground)]">
                  {data.relevant.opportunities[0].why[0]}
                </p>
                <Link className="text-[var(--accent)]" href={ROUTES.marketplace}>
                  View
                </Link>
              </li>
            ) : null}
            {data.relevant.people.length === 0 &&
            data.relevant.knowledge.length === 0 ? (
              <li className="text-[var(--muted)]">
                Recommendations appear as your graph grows.
              </li>
            ) : null}
          </ul>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="font-semibold">Your AI Twin</h3>
          <p className="mt-2 text-sm">Questions answered: {data.twin.questionsAnswered}</p>
          <p className="text-sm">
            Confidence: {data.twin.confidencePct}% · Coverage: {data.twin.coverage}
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {data.twin.suggestion}
          </p>
          {data.twin.topics.length ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Asked about: {data.twin.topics.join(", ")}
            </p>
          ) : null}
          <Button className="mt-3" size="sm" onClick={() => setMode("teach")}>
            Teach my Twin
          </Button>
        </GlassCard>
      </div>

      {data.challenge ? (
        <GlassCard className="p-5">
          <p className="text-xs uppercase text-[var(--muted)]">
            Today&apos;s Intelligence Opportunity
          </p>
          <p className="mt-1 font-medium">{data.challenge.title}</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            {data.challenge.description}
          </p>
        </GlassCard>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h3 className="font-semibold">Professional activity</h3>
          <p className="mt-2 text-sm">
            This month: {data.consistency.monthUpdates} meaningful updates
          </p>
          <p className="text-sm">This week: {data.consistency.weekUpdates}</p>
          {data.search.searches > 0 || data.search.visits > 0 ? (
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              This week your expertise appeared in {data.search.searches} relevant
              searches · {data.search.visits} profile visits from search
            </p>
          ) : null}
        </GlassCard>
        <GlassCard className="p-5">
          <h3 className="font-semibold">Growth timeline</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {timeline.slice(0, 6).map((row) => (
              <li key={row.id}>
                <span className="text-[var(--muted)]">
                  {new Date(row.createdAt).toLocaleDateString()}
                </span>{" "}
                {row.title}
              </li>
            ))}
            {timeline.length === 0 ? (
              <li className="text-[var(--muted)]">Complete today&apos;s action to start this timeline.</li>
            ) : null}
          </ul>
        </GlassCard>
      </div>

      {report ? (
        <GlassCard className="p-5">
          <h3 className="font-semibold">Your week in Smitvi</h3>
          <p className="mt-2 text-sm">{report.summary}</p>
          <Button asChild size="sm" className="mt-3" variant="secondary">
            <Link href={ROUTES.onboardingImprove}>Improve my profile</Link>
          </Button>
        </GlassCard>
      ) : null}

      {data.monetization ? (
        <GlassCard className="p-5">
          <p className="text-sm">{data.monetization.title}</p>
          <Button asChild size="sm" className="mt-3" variant="secondary">
            <Link href={data.monetization.href}>{data.monetization.cta}</Link>
          </Button>
        </GlassCard>
      ) : null}
    </div>
  );
}
