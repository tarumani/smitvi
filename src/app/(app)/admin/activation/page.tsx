import type { Metadata } from "next";
import { GetActivationAnalytics } from "@/application/admin/get-activation-analytics";
import { GlassCard } from "@/components/ui/glass-card";

export const metadata: Metadata = {
  title: "Activation analytics",
};

export default async function AdminActivationPage() {
  const data = await new GetActivationAnalytics().execute();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Activation funnel</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Privacy-safe aggregates. New Google logins stay REGISTERED until the
          Intelligence Profile meets activation quality.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4">
          <p className="text-sm text-[var(--muted)]">Registered</p>
          <p className="mt-1 text-2xl font-bold">{data.registered}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-[var(--muted)]">Avg readiness</p>
          <p className="mt-1 text-2xl font-bold">
            {data.averageIntelligenceReadiness}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-[var(--muted)]">Low-quality / thin</p>
          <p className="mt-1 text-2xl font-bold">{data.lowQualityProfiles}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-[var(--muted)]">Improved with AI</p>
          <p className="mt-1 text-2xl font-bold">{data.profilesImprovedWithAi}</p>
        </GlassCard>
      </div>
      <GlassCard className="p-5">
        <h2 className="font-semibold">Funnel</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {data.funnel.map((row) => (
            <li key={row.status} className="flex justify-between gap-4">
              <span>{row.status.replaceAll("_", " ")}</span>
              <span className="tabular-nums text-[var(--muted-foreground)]">
                {row.count} · {row.percent}%
              </span>
            </li>
          ))}
        </ul>
      </GlassCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="font-semibold">Profile types</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {data.profileTypes.map((row) => (
              <li key={String(row.type)} className="flex justify-between">
                <span>{row.type ?? "Unset"}</span>
                <span>{row.count}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="font-semibold">Common skills</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {data.topSkills.map((row) => (
              <li key={row.name} className="flex justify-between">
                <span>{row.name}</span>
                <span>{row.count}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
