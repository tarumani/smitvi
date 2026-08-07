import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLAN_CATALOG } from "@/config/billing";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { UpgradeButtons } from "@/components/billing/upgrade-buttons";
import { PageHero } from "@/components/layout/page-hero";
import { MarketingPageAtmosphere } from "@/components/marketing/marketing-page-atmosphere";
import { MarketingVisual } from "@/components/marketing/marketing-illustrations";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple Smitvi pricing — start free, upgrade for unlimited Twin chats and marketplace selling.",
};

export default async function PricingPage() {
  const session = await getCurrentSession();
  const plans = [PLAN_CATALOG.FREE, PLAN_CATALOG.PRO, PLAN_CATALOG.BUSINESS];

  return (
    <div className="relative overflow-hidden">
      <MarketingPageAtmosphere />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_min(340px,36%)] lg:items-center">
          <PageHero
            eyebrow="Pricing"
            title="Simple pricing for human intelligence"
            description="Start free. Upgrade when your Twin needs unlimited conversations. Marketplace sales keep a 20% platform commission."
            align="left"
          />
          <MarketingVisual id="pricing" className="mx-auto w-full max-w-md lg:max-w-none" />
        </div>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {plans.map((plan, index) => {
          const isCurrent = session?.user.plan === plan.id;
          const isPro = plan.id === "PRO";
          return (
            <GlassCard
              key={plan.id}
              className={`relative flex flex-col p-7 transition-transform duration-300 hover:-translate-y-1 ${
                isPro
                  ? "ring-2 ring-[var(--accent)] lg:scale-[1.02]"
                  : ""
              } ${
                index === 0
                  ? "animate-fade-up"
                  : index === 1
                    ? "animate-fade-up-delay-1"
                    : "animate-fade-up-delay-2"
              }`}
            >
              {isPro ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-foreground)]">
                  Most popular
                </span>
              ) : null}
              <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
                {plan.name}
              </p>
              <p className="mt-4 font-display text-5xl font-bold tracking-tight">
                {plan.priceCentsMonthly === 0
                  ? "$0"
                  : `$${(plan.priceCentsMonthly / 100).toFixed(0)}`}
                <span className="text-base font-medium text-[var(--muted)]">
                  {plan.priceCentsMonthly === 0 ? "" : "/mo"}
                </span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {plan.description}
              </p>
              <ul className="mt-7 flex-1 space-y-3 text-sm text-[var(--muted-foreground)]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.id === "FREE" ? (
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={session ? ROUTES.dashboard : ROUTES.signup}>
                      {session ? "Go to dashboard" : "Get started"}
                    </Link>
                  </Button>
                ) : !session ? (
                  <Button asChild className="w-full">
                    <Link
                      href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.pricing)}`}
                    >
                      Sign in to upgrade
                    </Link>
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
    </div>
  );
}
