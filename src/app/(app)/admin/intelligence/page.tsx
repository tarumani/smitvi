import type { Metadata } from "next";
import { GetIntelligenceAnalytics } from "@/application/admin/get-intelligence-analytics";
import { GlassCard } from "@/components/ui/glass-card";

export const metadata: Metadata = {
  title: "Daily Intelligence",
};

export default async function AdminIntelligencePage() {
  const data = await new GetIntelligenceAnalytics().execute();
  const cards = [
    ["DAU", data.dau],
    ["WAU", data.wau],
    ["MAU", data.mau],
    ["Meaningful actions (week)", data.meaningfulActionsThisWeek],
    ["Avg readiness", data.averageIntelligenceReadiness],
    ["Avg weekly improvement", data.averageWeeklyImprovement],
    ["NBA completion %", data.nextBestActionCompletionRate],
    ["Inactive", data.inactiveUsers],
    ["Twin queries (week)", data.twinActivityThisWeek],
    ["Knowledge created (week)", data.knowledgeCreatedThisWeek],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Daily Intelligence</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <GlassCard key={label} className="p-4">
            <p className="text-sm text-[var(--muted)]">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </GlassCard>
        ))}
      </div>
      <GlassCard className="p-5">
        <h2 className="font-semibold">Funnel</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {Object.entries(data.funnel).map(([key, value]) => (
            <li key={key} className="flex justify-between">
              <span>{key}</span>
              <span>{value}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
