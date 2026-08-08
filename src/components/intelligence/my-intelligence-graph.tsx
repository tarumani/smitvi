"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

type GraphEdge = {
  entity: { id: string; type: string; name: string; slug: string };
  relationship: {
    id: string;
    type: string;
    confidenceScore: number;
    verificationStatus: string;
    verified: boolean;
    source: string;
  };
};

type PendingItem = {
  id: string;
  type: string;
  confidenceScore: number;
  verificationStatus: string;
  target: { id: string; name: string; type: string } | null;
};

type GraphPayload = {
  user: { id: string; name: string } | null;
  skills: GraphEdge[];
  expertise: GraphEdge[];
  topics: GraphEdge[];
  technologies: GraphEdge[];
  tools: GraphEdge[];
  companies: GraphEdge[];
  projects: GraphEdge[];
  industries: GraphEdge[];
  pending: PendingItem[];
};

function Section({
  title,
  items,
}: {
  title: string;
  items: GraphEdge[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      <ul className="mt-2 space-y-1 border-l border-[var(--border)] pl-3 text-sm">
        {items.map(({ entity, relationship }) => (
          <li key={relationship.id} className="text-[var(--muted-foreground)]">
            <span className="text-[var(--foreground)]">{entity.name}</span>
            <span className="ml-2 text-xs text-[var(--muted)]">
              {Math.round(relationship.confidenceScore * 100)}% ·{" "}
              {relationship.verificationStatus.replace(/_/g, " ").toLowerCase()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MyIntelligenceGraphPreview() {
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/graph/me");
      const data = (await res.json()) as { graph?: GraphPayload; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load graph");
      }
      setGraph(data.graph ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateVerification = async (
    id: string,
    verificationStatus: "USER_VERIFIED" | "USER_REJECTED" | "HIDDEN",
  ) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/graph/relationships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Update failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <GlassCard className="flex items-center gap-2 p-6 text-sm text-[var(--muted-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your intelligence graph…
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6 text-sm text-red-400">
        {error}
        <Button variant="ghost" className="ml-2" onClick={() => void load()}>
          Retry
        </Button>
      </GlassCard>
    );
  }

  if (!graph?.user) {
    return (
      <GlassCard className="p-6 text-sm text-[var(--muted-foreground)]">
        Your graph is being prepared. Update your profile or train your Twin to
        populate skills and projects.
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h2 className="font-display text-xl font-semibold">My Intelligence</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Structured facts Smitvi uses for search, your Twin, and future
          recommendations. Confirm AI-detected items you agree with.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Section title="Skills" items={graph.skills} />
          <Section title="Expertise" items={graph.expertise} />
          <Section title="Topics" items={[...graph.topics, ...graph.industries]} />
          <Section title="Technologies" items={graph.technologies} />
          <Section title="Tools" items={graph.tools} />
          <Section title="Companies" items={graph.companies} />
          <Section title="Projects" items={graph.projects} />
        </div>
      </GlassCard>

      {graph.pending.length > 0 ? (
        <GlassCard className="p-6">
          <h3 className="font-display text-lg font-semibold">Review suggestions</h3>
          <ul className="mt-4 space-y-3">
            {graph.pending.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              >
                <span>
                  <span className="text-[var(--muted)]">
                    {item.type.replace(/_/g, " ").toLowerCase()}
                  </span>
                  {item.target ? (
                    <>
                      {" → "}
                      <strong>{item.target.name}</strong>
                    </>
                  ) : null}
                  <span className="ml-2 text-xs text-[var(--muted)]">
                    {Math.round(item.confidenceScore * 100)}% · AI detected
                  </span>
                </span>
                <span className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={actingId === item.id}
                    onClick={() =>
                      void updateVerification(item.id, "USER_VERIFIED")
                    }
                  >
                    <Check className="h-3.5 w-3.5" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actingId === item.id}
                    onClick={() =>
                      void updateVerification(item.id, "USER_REJECTED")
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}
    </div>
  );
}
