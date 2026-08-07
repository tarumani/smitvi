import type { Metadata } from "next";
import Link from "next/link";
import { GetGrowthMetrics } from "@/application/growth/get-growth-metrics";
import { container } from "@/application/container";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import { formatInrFromMinorUnits } from "@/lib/format-money";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminOverviewPage() {
  const [users, twins, knowledge, conversations, failedUploads, bannedUsers, incompleteOnboarding, growth] =
    await Promise.all([
      container.users.countAll(),
      container.profiles.countAll(),
      container.knowledge.countAll(),
      container.conversations.countAll(),
      container.knowledge.countByStatus("FAILED"),
      container.users.countBanned(),
      container.users.countForAdminList({ filter: "incomplete" }),
      new GetGrowthMetrics().execute(),
    ]);

  const cards = [
    { label: "Users", value: users, href: ROUTES.adminUsers },
    {
      label: "Incomplete onboarding",
      value: incompleteOnboarding,
      href: `${ROUTES.adminUsers}?filter=incomplete`,
    },
    {
      label: "Public hubs live",
      value: growth.qualifiedPublicHubs,
      href: ROUTES.adminGrowth,
    },
    {
      label: "Marketplace net (INR)",
      value: growth.marketplaceNetRevenueCents,
      href: ROUTES.adminGrowth,
      formatMoney: true,
    },
    { label: "Twins / profiles", value: twins, href: ROUTES.adminTwins },
    { label: "Knowledge uploads", value: knowledge, href: ROUTES.adminKnowledge },
    { label: "Conversations", value: conversations, href: ROUTES.adminModeration },
    { label: "Failed uploads", value: failedUploads, href: ROUTES.adminModeration },
    { label: "Banned users", value: bannedUsers, href: ROUTES.adminUsers },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Link key={card.label} href={card.href}>
          <GlassCard className="p-5 transition-colors hover:bg-[var(--surface-elevated)]">
            <p className="text-sm text-[var(--muted)]">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">
              {"formatMoney" in card && card.formatMoney
                ? formatInrFromMinorUnits(card.value as number)
                : card.value}
            </p>
          </GlassCard>
        </Link>
      ))}
    </div>
  );
}
