import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ROUTES } from "@/config/constants";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { formatInrFromMinorUnits } from "@/lib/format-money";

export const metadata: Metadata = { title: "Monetization" };

export default async function MonetizationDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const dash = await container.monetizationAnalytics.getCreatorDashboard(
    session.user.id,
  );

  const cards = [
    { label: "Lifetime earnings", value: dash.revenue.lifetimeCents },
    { label: "This month", value: dash.revenue.thisMonthCents },
    { label: "Last month", value: dash.revenue.lastMonthCents },
    {
      label: "Available balance",
      value: dash.wallet.availableBalanceCents,
    },
    { label: "Pending balance", value: dash.wallet.pendingBalanceCents },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Monetization
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Turn your intelligence hub into income — products, AI access, and
            consultations.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={ROUTES.monetizationAnalytics}>Analytics</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <GlassCard key={c.label} className="p-5">
            <p className="text-sm text-[var(--muted-foreground)]">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-bold">
              {formatInrFromMinorUnits(c.value)}
            </p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-5">
        <h2 className="font-semibold">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={ROUTES.marketplaceSell}>Create product</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={ROUTES.consultationSettings}>Consultation services</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.publicStore(session.profile.username)}>
              View store
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Active listings: {dash.activeListings} · Pending orders:{" "}
          {dash.pendingOrders}
        </p>
      </GlassCard>
    </div>
  );
}
