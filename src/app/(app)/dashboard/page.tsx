import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Upload } from "lucide-react";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import { formatInrFromMinorUnits } from "@/lib/format-money";

export const metadata: Metadata = {
  title: "Dashboard",
};

function resolveTwinStatus(
  sources: { status: string }[],
): { label: string; detail: string } {
  if (sources.some((source) => source.status === "READY")) {
    return { label: "Ready", detail: "Your Twin can answer from uploaded knowledge." };
  }
  const processing = sources.some(
    (source) =>
      source.status !== "FAILED" &&
      source.status !== "READY" &&
      source.status !== "PENDING",
  );
  if (processing) {
    return { label: "Training", detail: "We’re indexing your latest uploads." };
  }
  if (sources.some((source) => source.status === "PENDING")) {
    return { label: "Processing", detail: "Uploads are queued for indexing." };
  }
  if (sources.some((source) => source.status === "FAILED")) {
    return { label: "Needs attention", detail: "Fix failed uploads to go live." };
  }
  return {
    label: "Not ready",
    detail: "Upload knowledge to activate your AI Twin.",
  };
}

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect(ROUTES.login);
  }

  if (!session.profile?.isOnboarded) {
    redirect(ROUTES.onboarding);
  }

  const userId = session.user.id;
  const sources = await container.knowledge.listByUser(userId);

  const [engagement, totalEarningsCents, monthlyEarningsCents] =
    await Promise.all([
      container.conversations.getOwnerTwinEngagementStats(userId),
      container.marketplace.sumSellerNetEarningsCents(userId),
      container.marketplace.sumSellerNetEarningsThisMonthCents(userId),
    ]);

  const twinStatus = resolveTwinStatus(sources);

  const stats = [
    {
      emoji: "💰",
      label: "Earnings",
      value: formatInrFromMinorUnits(totalEarningsCents),
    },
    {
      emoji: "🤖",
      label: "AI Twin Status",
      value: twinStatus.label,
    },
    {
      emoji: "👥",
      label: "Visitors Today",
      value: String(engagement.visitorsToday),
    },
    {
      emoji: "💬",
      label: "Questions Answered",
      value: String(engagement.questionsAnswered),
    },
    {
      emoji: "📈",
      label: "Estimated Monthly Income",
      value: formatInrFromMinorUnits(monthlyEarningsCents),
    },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Welcome, {session.profile.displayName}
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          @{session.profile.username} ·{" "}
          <Link
            href={ROUTES.publicProfile(session.profile.username)}
            className="text-[var(--accent)] hover:underline"
          >
            View public profile
          </Link>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="p-5">
            <p className="text-sm text-[var(--muted-foreground)]">
              <span className="mr-1.5" aria-hidden>
                {stat.emoji}
              </span>
              {stat.label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight">
              {stat.value}
            </p>
            {stat.label === "AI Twin Status" ? (
              <p className="mt-1 text-xs text-[var(--muted)]">
                {twinStatus.detail}
              </p>
            ) : null}
            {stat.label === "Estimated Monthly Income" ? (
              <p className="mt-1 text-xs text-[var(--muted)]">
                Marketplace net paid this calendar month
              </p>
            ) : null}
          </GlassCard>
        ))}

        <GlassCard className="flex flex-col justify-between p-5 sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">
              <span className="mr-1.5" aria-hidden>
                ⬆
              </span>
              Upload More Knowledge
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              More grounded knowledge means better answers, more visitors, and
              higher earning potential.
            </p>
          </div>
          <Button asChild className="mt-4 w-full sm:w-auto">
            <Link href={ROUTES.knowledge}>
              <Upload className="h-4 w-4" />
              Upload More Knowledge
            </Link>
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}
