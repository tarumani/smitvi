import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import {
  TopEarnersPanel,
  type TopEarnerRow,
} from "@/components/marketplace/top-earners-panel";
import { MARKETPLACE_COMMISSION_RATE } from "@/config/constants";

type Props = {
  earners: TopEarnerRow[];
  hasLiveEarners: boolean;
  sellHref: string;
};

export function MarketplaceAside({
  earners,
  hasLiveEarners,
  sellHref,
}: Props) {
  const feePct = Math.round(MARKETPLACE_COMMISSION_RATE * 100);

  return (
    <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
      <GlassCard className="p-4 sm:p-5">
        <TopEarnersPanel
          earners={earners}
          hasLiveEarners={hasLiveEarners}
          sellHref={sellHref}
          variant="sidebar"
        />
      </GlassCard>

      <GlassCard className="p-4 sm:p-5">
        <h3 className="font-display text-base font-semibold tracking-tight">
          How the marketplace works
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)]">
          <li>
            Experts list consultations, knowledge packs, and services buyers can
            purchase instantly.
          </li>
          <li>
            Smitvi takes a {feePct}% platform fee; the rest is net earnings for
            the seller.
          </li>
          <li>Checkout via Razorpay (or Stripe where enabled).</li>
        </ul>
      </GlassCard>
    </aside>
  );
}
