import type { Metadata } from "next";
import { GetGrowthMetrics } from "@/application/growth/get-growth-metrics";
import { GlassCard } from "@/components/ui/glass-card";
import { formatInrFromMinorUnits } from "@/lib/format-money";

export const metadata: Metadata = {
  title: "Growth metrics",
};

export default async function AdminGrowthPage() {
  const metrics = await new GetGrowthMetrics().execute();

  const activationRate =
    metrics.totalUsers > 0
      ? Math.round((metrics.onboardedProfiles / metrics.totalUsers) * 100)
      : 0;
  const contentRate =
    metrics.onboardedProfiles > 0
      ? Math.round(
          (metrics.profilesWithKnowledge / metrics.onboardedProfiles) * 100,
        )
      : 0;
  const twinLiveRate =
    metrics.profilesWithKnowledge > 0
      ? Math.round((metrics.twinsReady / metrics.profilesWithKnowledge) * 100)
      : 0;

  const kpis = [
    { label: "Total users", value: String(metrics.totalUsers) },
    { label: "Activated profiles", value: String(metrics.onboardedProfiles) },
    {
      label: "Activation rate",
      value: `${activationRate}%`,
      hint: "isOnboarded / users",
    },
    {
      label: "Uploaded knowledge",
      value: String(metrics.profilesWithKnowledge),
    },
    { label: "Content rate", value: `${contentRate}%`, hint: "upload / activated" },
    { label: "Twins ready", value: String(metrics.twinsReady) },
    { label: "Twin live rate", value: `${twinLiveRate}%`, hint: "READY / uploaders" },
    {
      label: "Public hubs (discoverable)",
      value: String(metrics.qualifiedPublicHubs),
    },
    {
      label: "Active listings",
      value: String(metrics.activeMarketplaceListings),
    },
    {
      label: "Paid orders",
      value: String(metrics.paidMarketplaceOrders),
    },
    {
      label: "Marketplace net (INR)",
      value: formatInrFromMinorUnits(metrics.marketplaceNetRevenueCents),
    },
  ] as const;

  return (
    <div className="space-y-8">
      <p className="text-sm text-[var(--muted-foreground)]">
        Track progress toward genuine users, real content, and revenue. Focus:
        activation → first upload → Twin READY → listings → paid orders.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <GlassCard key={kpi.label} className="p-5">
            <p className="text-sm text-[var(--muted)]">{kpi.label}</p>
            <p className="mt-2 font-display text-2xl font-bold">{kpi.value}</p>
            {"hint" in kpi && kpi.hint ? (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {kpi.hint}
              </p>
            ) : null}
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <h2 className="font-display text-lg font-semibold">
          Incomplete onboarding by step
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Users who have not finished activation yet.
        </p>
        <ul className="mt-4 space-y-2">
          {metrics.onboardingStepCounts.length === 0 ? (
            <li className="text-sm text-[var(--muted)]">No incomplete profiles.</li>
          ) : (
            metrics.onboardingStepCounts.map((row) => (
              <li
                key={row.step}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
              >
                <span className="font-medium">{row.step}</span>
                <span className="tabular-nums text-[var(--muted-foreground)]">
                  {row.count}
                </span>
              </li>
            ))
          )}
        </ul>
      </GlassCard>
    </div>
  );
}
