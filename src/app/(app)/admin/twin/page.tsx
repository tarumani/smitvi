import { container } from "@/application/container";
import { GlassCard } from "@/components/ui/glass-card";

export default async function AdminTwinPage() {
  const summary = await container.twinAnalytics.getAdminSummary();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">AI Twin analytics</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Graph-aware Twin quality signals (last 30 days).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Questions</p>
          <p className="mt-2 font-display text-3xl font-bold">
            {summary.totalQueries}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted-foreground)]">
            Low-confidence / unknown
          </p>
          <p className="mt-2 font-display text-3xl font-bold">
            {summary.lowConfidenceAnswers}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Avg latency</p>
          <p className="mt-2 font-display text-3xl font-bold">
            {summary.avgLatencyMs}ms
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted-foreground)]">
            Graph retrieval rate
          </p>
          <p className="mt-2 font-display text-3xl font-bold">
            {summary.graphRetrievalRate}%
          </p>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h3 className="font-semibold">User feedback</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {summary.feedback.length === 0 ? (
            <li className="text-[var(--muted-foreground)]">No feedback yet.</li>
          ) : (
            summary.feedback.map((row) => (
              <li key={row.type} className="flex justify-between gap-4">
                <span>{row.type}</span>
                <span className="text-[var(--muted)]">{row.count}</span>
              </li>
            ))
          )}
        </ul>
      </GlassCard>
    </div>
  );
}
