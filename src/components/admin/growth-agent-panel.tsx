"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";

type ProspectRow = {
  id: string;
  name: string;
  profession: string | null;
  overallGrowthScore: number | null;
  smitviFitScore: number | null;
  creatorPotentialScore: number | null;
  monetizationPotentialScore: number | null;
  source: string;
  status: string;
  updatedAt: string;
  campaign?: { name: string } | null;
};

type OpportunityRow = {
  id: string;
  title: string;
  opportunityScore: number;
  demandSignal: string | null;
  supplySignal: string | null;
};

export function GrowthAgentPanel(props: {
  opportunities: OpportunityRow[];
  prospects: ProspectRow[];
  pendingReviews: number;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(path: string, body?: object) {
    setBusy(path);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await res.json()) as { error?: string; data?: unknown };
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setMessage("Done — refresh to see updates.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!!busy}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={async () => {
            setBusy("refresh");
            setMessage(null);
            try {
              await fetch("/api/admin/growth/opportunities?refresh=1");
              setMessage("Opportunities refreshed — reload page.");
            } catch {
              setMessage("Refresh failed");
            } finally {
              setBusy(null);
            }
          }}
        >
          Refresh opportunities
        </button>
        <button
          type="button"
          disabled={!!busy}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
          onClick={() => {
            void run("/api/admin/growth");
          }}
        >
          Process background jobs
        </button>
        {message ? (
          <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
        ) : null}
      </div>

      <GlassCard className="p-6">
        <h2 className="font-display text-lg font-semibold">
          Who should Smitvi recruit next?
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {props.pendingReviews} message drafts awaiting human review.
        </p>
        <ol className="mt-4 space-y-3">
          {props.opportunities.length === 0 ? (
            <li className="text-sm text-[var(--muted)]">
              Run opportunity analysis to populate gaps.
            </li>
          ) : (
            props.opportunities.slice(0, 8).map((o, i) => (
              <li
                key={o.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-[var(--border)] px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-semibold tabular-nums">{i + 1}.</span>{" "}
                  {o.title}
                </span>
                <span className="text-[var(--accent)] tabular-nums">
                  Score {o.opportunityScore}
                </span>
                <span className="w-full text-xs text-[var(--muted-foreground)]">
                  Demand: {o.demandSignal ?? "—"} · Supply: {o.supplySignal ?? "—"}
                </span>
              </li>
            ))
          )}
        </ol>
      </GlassCard>

      <GlassCard className="overflow-x-auto p-6">
        <h2 className="font-display text-lg font-semibold">Prospects</h2>
        <table className="mt-4 w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Profession</th>
              <th className="py-2 pr-4">Fit</th>
              <th className="py-2 pr-4">Creator</th>
              <th className="py-2 pr-4">Revenue</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {props.prospects.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-[var(--muted)]">
                  No prospects yet — add via API or POST /api/admin/growth/prospects.
                </td>
              </tr>
            ) : (
              props.prospects.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)]/60">
                  <td className="py-2 pr-4 font-medium">{p.name}</td>
                  <td className="py-2 pr-4">{p.profession ?? "—"}</td>
                  <td className="py-2 pr-4 tabular-nums">
                    {p.smitviFitScore ?? "—"}
                  </td>
                  <td className="py-2 pr-4 tabular-nums">
                    {p.creatorPotentialScore ?? "—"}
                  </td>
                  <td className="py-2 pr-4 tabular-nums">
                    {p.monetizationPotentialScore ?? "—"}
                  </td>
                  <td className="py-2 pr-4">{p.status}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs text-[var(--accent)]"
                        disabled={!!busy}
                        onClick={() =>
                          run("/api/admin/growth/prospects/research", {
                            prospectId: p.id,
                          })
                        }
                      >
                        Research
                      </button>
                      <button
                        type="button"
                        className="text-xs text-[var(--accent)]"
                        disabled={!!busy}
                        onClick={() =>
                          run("/api/admin/growth/prospects/score", {
                            prospectId: p.id,
                          })
                        }
                      >
                        Score
                      </button>
                      <button
                        type="button"
                        className="text-xs text-[var(--accent)]"
                        disabled={!!busy}
                        onClick={() =>
                          run("/api/admin/growth/messages/generate", {
                            prospectId: p.id,
                            channel: "EMAIL",
                          })
                        }
                      >
                        Draft email
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>

      <p className="text-xs text-[var(--muted-foreground)]">
        Outbound messages require human approval before any send record. Smitvi
        does not auto-send LinkedIn or bulk email.
      </p>
    </div>
  );
}
