import type { Metadata } from "next";
import { GetActivationAnalytics } from "@/application/admin/get-activation-analytics";
import { getAdminSession } from "@/application/auth/require-admin";
import { UserAdminActions } from "@/components/admin/user-admin-actions";
import { GlassCard } from "@/components/ui/glass-card";
import { ACTIVATION_MISSING_LABELS } from "@/domain/profile/activation";
import { isPrivileged } from "@/domain/user/entities";
import type { UserRole } from "@/domain/user/entities";

export const metadata: Metadata = {
  title: "Activation analytics",
};

export default async function AdminActivationPage() {
  const session = await getAdminSession();
  const data = await new GetActivationAnalytics().execute();
  const canMutate = session ? isPrivileged(session.user.role) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Activation funnel</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Incomplete profiles are auto-paused after 7 days. Admins can delete
          those accounts from this queue. Users can still sign in to finish
          activation.
        </p>
      </div>
      <GlassCard className="p-5">
        <h2 className="font-semibold">Incomplete profile queue</h2>
        {data.incompleteQueue.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No incomplete profiles right now.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {data.incompleteQueue.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {row.displayName ?? row.email}
                    {row.username ? (
                      <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                        @{row.username}
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-sm text-[var(--muted-foreground)]">
                    {row.email}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {row.activationStatus.replaceAll("_", " ")} · {row.daysSinceJoin}{" "}
                    days since join
                    {row.paused ? " · Auto-paused" : ""}
                    {row.eligibleToDelete
                      ? " · Eligible to delete"
                      : ` · Auto-pause ${new Date(row.autoBlockAt).toLocaleDateString()}`}
                  </p>
                  {row.missing.length > 0 ? (
                    <p className="mt-1 text-xs text-amber-600">
                      Missing:{" "}
                      {row.missing
                        .map((key) => ACTIVATION_MISSING_LABELS[key] ?? key)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
                <UserAdminActions
                  userId={row.id}
                  email={row.email}
                  role={row.role as UserRole}
                  isBanned={row.isBanned}
                  canMutate={canMutate && session?.user.id !== row.id}
                />
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4">
          <p className="text-sm text-[var(--muted)]">Incomplete profiles</p>
          <p className="mt-1 text-2xl font-bold">{data.incompleteProfiles}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-[var(--muted)]">Eligible to delete (7+ days)</p>
          <p className="mt-1 text-2xl font-bold">{data.eligibleToDelete}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-[var(--muted)]">Auto-paused</p>
          <p className="mt-1 text-2xl font-bold">{data.pausedIncomplete}</p>
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
