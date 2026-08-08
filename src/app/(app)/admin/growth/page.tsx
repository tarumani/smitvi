import type { Metadata } from "next";
import { GetGrowthMetrics } from "@/application/growth/get-growth-metrics";
import { container } from "@/application/container";
import { prisma } from "@/infrastructure/database/prisma";
import { GrowthAgentPanel } from "@/components/admin/growth-agent-panel";
import { GlassCard } from "@/components/ui/glass-card";
import { formatInrFromMinorUnits } from "@/lib/format-money";

export const metadata: Metadata = {
  title: "Growth Agent",
};

export default async function AdminGrowthPage() {
  const metrics = await new GetGrowthMetrics().execute();
  const overview = await container.growthAgent.getOverview();
  const { prospects } = await container.growthProspects.list({ limit: 25 });

  const pendingMessages = await prisma.growthMessage.findMany({
    where: { approvalStatus: "PENDING_REVIEW" },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { prospect: { select: { name: true } } },
  });

  const activationRate =
    metrics.totalUsers > 0
      ? Math.round((metrics.onboardedProfiles / metrics.totalUsers) * 100)
      : 0;

  const kpis = [
    { label: "Total users", value: String(metrics.totalUsers) },
    { label: "Activated profiles", value: String(metrics.onboardedProfiles) },
    { label: "Activation rate", value: `${activationRate}%` },
    { label: "Growth prospects", value: String(overview.totalProspects) },
    {
      label: "Pending outreach review",
      value: String(overview.pendingMessageReviews),
    },
    {
      label: "Marketplace net (INR)",
      value: formatInrFromMinorUnits(metrics.marketplaceNetRevenueCents),
    },
  ] as const;

  return (
    <div className="space-y-8">
      <p className="text-sm text-[var(--muted-foreground)]">
        AI Growth Agent — identify high-value creators, score fit, draft outreach
        with mandatory human approval. Optimizes activated, monetizing creators.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <GlassCard key={kpi.label} className="p-5">
            <p className="text-sm text-[var(--muted)]">{kpi.label}</p>
            <p className="mt-2 font-display text-2xl font-bold">{kpi.value}</p>
          </GlassCard>
        ))}
      </div>

      <GrowthAgentPanel
        opportunities={overview.topOpportunities}
        prospects={prospects.map((p) => ({
          ...p,
          updatedAt: p.updatedAt.toISOString(),
          campaign: p.campaign,
        }))}
        pendingReviews={overview.pendingMessageReviews}
      />

      {pendingMessages.length > 0 ? (
        <GlassCard className="p-6">
          <h2 className="font-display text-lg font-semibold">Message approvals</h2>
          <ul className="mt-4 space-y-4">
            {pendingMessages.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-[var(--border)] p-4 text-sm"
              >
                <p className="font-medium">
                  {m.prospect.name} · {m.channel}
                </p>
                {m.subject ? (
                  <p className="mt-1 text-[var(--muted-foreground)]">{m.subject}</p>
                ) : null}
                <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Approve via POST /api/admin/growth/messages/approve (admin tools
                  or API client).
                </p>
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}
    </div>
  );
}
