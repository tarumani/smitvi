import Link from "next/link";
import { prisma } from "@/infrastructure/database/prisma";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export async function IntelligenceAlerts({ userId }: { userId: string }) {
  try {
    const [weekly, action] = await Promise.all([
      prisma.weeklyIntelligenceReport.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.nextBestAction.findFirst({
        where: { userId, status: "PENDING" },
        orderBy: { priority: "desc" },
      }),
    ]);

    if (!weekly && !action) return null;

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {weekly ? (
          <Link href={ROUTES.hub.today}>
            <GlassCard className="h-full p-4 transition-colors hover:bg-[var(--surface-elevated)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                Weekly report
              </p>
              <p className="mt-1 font-medium">Your Intelligence Report is ready</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {weekly.summary}
              </p>
            </GlassCard>
          </Link>
        ) : null}
        {action ? (
          <Link href={ROUTES.hub.today}>
            <GlassCard className="h-full p-4 transition-colors hover:bg-[var(--surface-elevated)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                Profile value
              </p>
              <p className="mt-1 font-medium">{action.title}</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {action.description}
              </p>
            </GlassCard>
          </Link>
        ) : null}
      </div>
    );
  } catch {
    return null;
  }
}
