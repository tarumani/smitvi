import { container } from "@/application/container";
import { GlassCard } from "@/components/ui/glass-card";

export default async function AdminRecommendationsPage() {
  const summary = await container.recommendationAnalytics.getAdminSummary();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">
          Recommendation analytics
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          CTR proxies, dismissals, and graph health (last 30 days).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted-foreground)]">
            Profile opens / clicks
          </p>
          <p className="mt-2 font-display text-3xl font-bold">
            {summary.profileOpenRate}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Dismissals</p>
          <p className="mt-2 font-display text-3xl font-bold">
            {summary.dismissCount}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted-foreground)]">
            Graph completeness
          </p>
          <p className="mt-2 font-display text-3xl font-bold">
            {summary.graphHealth.completenessRatio}%
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted-foreground)]">
            Active entities
          </p>
          <p className="mt-2 font-display text-3xl font-bold">
            {summary.graphHealth.entityCount}
          </p>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h3 className="font-semibold">Events by recommendation type</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {summary.byType.length === 0 ? (
            <li className="text-[var(--muted-foreground)]">
              No recommendation events yet.
            </li>
          ) : (
            summary.byType.map((row) => (
              <li key={row.type} className="flex justify-between gap-4">
                <span>{row.type}</span>
                <span className="text-[var(--muted)]">{row.count}</span>
              </li>
            ))
          )}
        </ul>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="font-semibold">Top recommended targets (profile opens)</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {summary.topRecommendedTargets.map((row) => (
            <li key={row.targetId} className="flex justify-between gap-4">
              <span className="truncate font-mono text-xs">{row.targetId}</span>
              <span className="text-[var(--muted)]">{row.opens}</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="font-semibold">Graph health</h3>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">Relationships</dt>
            <dd>{summary.graphHealth.relationshipCount}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Evidence rows</dt>
            <dd>{summary.graphHealth.evidenceCount}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">User anchors</dt>
            <dd>{summary.graphHealth.userAnchors}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Profiles</dt>
            <dd>{summary.graphHealth.profileCount}</dd>
          </div>
        </dl>
      </GlassCard>
    </div>
  );
}
