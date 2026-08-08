import { container } from "@/application/container";
import { GlassCard } from "@/components/ui/glass-card";

export default async function AdminSearchPage() {
  const summary = await container.unifiedSearch.getAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Search analytics</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Anonymized queries and outcomes (last 30 days).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Zero-result searches</p>
          <p className="mt-2 font-display text-3xl font-bold">
            {summary.zeroResultSearches}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Top intents</p>
          <ul className="mt-2 space-y-1 text-sm">
            {summary.intents.slice(0, 5).map((i) => (
              <li key={i.intent}>
                {i.intent}: {i.count}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h3 className="font-semibold">Top searches</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {summary.topQueries.map((row) => (
            <li key={row.query} className="flex justify-between gap-4">
              <span className="truncate">{row.query}</span>
              <span className="text-[var(--muted)]">{row.count}</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="font-semibold">Most clicked experts</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {summary.mostClickedExperts.map((row) => (
            <li key={row.username} className="flex justify-between gap-4">
              <span>@{row.username}</span>
              <span className="text-[var(--muted)]">{row.clicks}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
