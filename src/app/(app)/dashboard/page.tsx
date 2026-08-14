import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Upload } from "lucide-react";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  APP_OUTCOME,
  ROUTES,
  TRAIN_TWIN_LABEL,
} from "@/config/constants";
import { IntelligenceActivationHub } from "@/components/dashboard/intelligence-activation-hub";
import { ImproveIntelligenceBanner } from "@/components/dashboard/improve-intelligence-banner";
import { IntelligenceAlerts } from "@/components/intelligence/intelligence-alerts";
import { ForYouFeed } from "@/components/recommendations/for-you-feed";
import { TwinLaunchWizard } from "@/components/dashboard/twin-launch-wizard";
import { HubSharePromo } from "@/components/dashboard/hub-share-promo";
import { ReferralInviteCard } from "@/components/dashboard/referral-invite-card";
import { formatInrFromMinorUnits } from "@/lib/format-money";
import { prisma } from "@/infrastructure/database/prisma";

export const metadata: Metadata = {
  title: "Dashboard",
};

function resolveTwinStatus(
  sources: { status: string }[],
): { label: string; detail: string } {
  if (sources.some((source) => source.status === "READY")) {
    return {
      label: "Ready",
      detail: "Your Twin is live — keep training to grow visits and income.",
    };
  }
  const processing = sources.some(
    (source) =>
      source.status !== "FAILED" &&
      source.status !== "READY" &&
      source.status !== "PENDING",
  );
  if (processing) {
    return { label: "Training", detail: "We’re turning your expertise into answers." };
  }
  if (sources.some((source) => source.status === "PENDING")) {
    return { label: "Processing", detail: "Your latest training is queued." };
  }
  if (sources.some((source) => source.status === "FAILED")) {
    return { label: "Needs attention", detail: "Fix failed training files to go live." };
  }
  return {
    label: "Not ready",
    detail: `${TRAIN_TWIN_LABEL} to start earning from what you know.`,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ launch?: string }>;
}) {
  const { launch } = await searchParams;
  const session = await getCurrentSession();
  if (!session) {
    redirect(ROUTES.login);
  }

  if (!session.profile?.isOnboarded) {
    redirect(ROUTES.onboarding);
  }

  const userId = session.user.id;
  const sources = await container.knowledge.listByUser(userId);
  const sellerListings = await container.marketplace.listActiveBySeller(userId);
  const twinReady = sources.some((source) => source.status === "READY");
  const consultationOffer =
    await container.consultations.getEnabledOfferByUserId(userId);

  const [engagement, totalEarningsCents, monthlyEarningsCents, inboxCount, pendingConsults, marketplaceOrders, referralCount] =
    await Promise.all([
      container.conversations.getOwnerTwinEngagementStats(userId),
      container.marketplace.sumSellerNetEarningsCents(userId),
      container.marketplace.sumSellerNetEarningsThisMonthCents(userId),
      container.conversations.countInboxForOwner(userId),
      container.consultations.countPendingForExpert(userId),
      container.marketplace.countRecentSellerOrders(userId),
      prisma.profile.count({
        where: { referrerUsername: session.profile.username },
      }),
    ]);

  const leadsCount = inboxCount + pendingConsults + marketplaceOrders;

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

  const businessCards = [
    {
      emoji: "📥",
      label: "Leads",
      value: String(leadsCount),
      detail: "Inbox threads, consult requests, and recent orders",
      href: ROUTES.hub.leads,
    },
    {
      emoji: "📅",
      label: "Pending consults",
      value: String(pendingConsults),
      detail: "Booking requests awaiting your response",
      href: ROUTES.consultationSettings,
    },
    {
      emoji: "🛒",
      label: "Marketplace orders",
      value: String(marketplaceOrders),
      detail: "Buyer orders in the last 30 days",
      href: ROUTES.marketplaceOrders,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Welcome, {session.profile.displayName}
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          {APP_OUTCOME}{" "}
          <span className="text-[var(--muted)]">·</span>{" "}
          <Link
            href={ROUTES.publicProfile(session.profile.username)}
            className="text-[var(--accent)] hover:underline"
          >
            @{session.profile.username}
          </Link>
          {" · "}
          <Link
            href={ROUTES.hub.today}
            className="text-[var(--accent)] hover:underline"
          >
            Your Intelligence Today
          </Link>
        </p>
      </div>

      <TwinLaunchWizard
        username={session.profile.username}
        knowledgeCount={sources.length}
        twinReady={twinReady}
        consultationsEnabled={Boolean(consultationOffer)}
        listingCount={sellerListings.length}
        initialStepId={launch ?? null}
      />

      <ImproveIntelligenceBanner
        score={session.profile.intelligenceReadinessScore ?? 0}
        activated={
          session.profile.activationStatus === "PROFILE_ACTIVATED" ||
          session.profile.activationStatus === "INTELLIGENCE_READY" ||
          session.profile.activationStatus === "DISCOVERABLE" ||
          session.profile.activationStatus === "MONETIZABLE"
        }
      />

      <IntelligenceAlerts userId={userId} />

      <IntelligenceActivationHub
        userId={userId}
        emailVerified={session.user.emailVerified}
      />

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
              {TRAIN_TWIN_LABEL}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              Every new source helps your Twin answer better, attract visitors,
              and unlock marketplace and consultation income.
            </p>
          </div>
          <Button asChild className="mt-4 w-full sm:w-auto">
            <Link href={ROUTES.hub.intelligence}>
              <Upload className="h-4 w-4" />
              {TRAIN_TWIN_LABEL}
            </Link>
          </Button>
        </GlassCard>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold">Business</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {businessCards.map((card) => (
            <GlassCard key={card.label} className="p-5">
              <p className="text-sm text-[var(--muted-foreground)]">
                <span className="mr-1.5" aria-hidden>
                  {card.emoji}
                </span>
                {card.label}
              </p>
              <p className="mt-2 font-display text-2xl font-bold tracking-tight">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">{card.detail}</p>
              <Button asChild variant="ghost" className="mt-2 h-auto p-0">
                <Link href={card.href}>View</Link>
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <HubSharePromo
          username={session.profile.username}
          displayName={session.profile.displayName}
          headline={session.profile.headline ?? null}
          avatarUrl={session.profile.avatarUrl ?? null}
          twinReady={twinReady}
        />

        <ReferralInviteCard
          username={session.profile.username}
          displayName={session.profile.displayName}
          referralCount={referralCount}
        />
      </div>

      <ForYouFeed />
    </div>
  );
}
