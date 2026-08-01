import type { Metadata } from "next";
import Link from "next/link";
import { PLAN_CATALOG } from "@/config/billing";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { UpgradeButtons } from "@/components/billing/upgrade-buttons";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Pricing",
};

export default async function PricingPage() {
  const session = await getCurrentSession();
  const plans = [PLAN_CATALOG.FREE, PLAN_CATALOG.PRO, PLAN_CATALOG.BUSINESS];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Simple pricing for human intelligence
        </h1>
        <p className="mt-4 text-[var(--muted-foreground)]">
          Start free. Upgrade when your Twin needs unlimited conversations.
          Marketplace sales keep a 20% platform commission.
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = session?.user.plan === plan.id;
          return (
            <GlassCard
              key={plan.id}
              className={`flex flex-col p-6 ${plan.id === "PRO" ? "ring-1 ring-[var(--accent)]" : ""}`}
            >
              <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
                {plan.name}
              </p>
              <p className="mt-4 font-display text-4xl font-bold">
                {plan.priceCentsMonthly === 0
                  ? "$0"
                  : `$${(plan.priceCentsMonthly / 100).toFixed(0)}`}
                <span className="text-base font-medium text-[var(--muted)]">
                  {plan.priceCentsMonthly === 0 ? "" : "/mo"}
                </span>
              </p>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                {plan.description}
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-[var(--muted-foreground)]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.id === "FREE" ? (
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={session ? ROUTES.dashboard : ROUTES.signup}>
                      {session ? "Current free plan" : "Get started"}
                    </Link>
                  </Button>
                ) : !session ? (
                  <Button asChild className="w-full">
                    <Link href={ROUTES.signup}>Sign up to upgrade</Link>
                  </Button>
                ) : isCurrent ? (
                  <Button disabled className="w-full" variant="secondary">
                    Current plan
                  </Button>
                ) : (
                  <UpgradeButtons plan={plan.id} />
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
