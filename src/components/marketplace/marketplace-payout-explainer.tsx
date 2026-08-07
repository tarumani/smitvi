"use client";

import { useMemo } from "react";
import { calculateMarketplaceSplit } from "@/config/billing";
import { MARKETPLACE_COMMISSION_RATE, ROUTES } from "@/config/constants";
import Link from "next/link";

type Props = {
  /** Example list price in USD (whole dollars). */
  examplePriceUsd?: number;
  className?: string;
};

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function MarketplacePayoutExplainer({
  examplePriceUsd = 100,
  className,
}: Props) {
  const grossCents = Math.max(100, Math.round(examplePriceUsd * 100));
  const split = useMemo(
    () => calculateMarketplaceSplit(grossCents),
    [grossCents],
  );

  const commissionPct = Math.round(MARKETPLACE_COMMISSION_RATE * 100);

  return (
    <div
      className={
        className ??
        "rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 p-5 text-sm"
      }
    >
      <h3 className="font-semibold text-[var(--foreground)]">
        What you keep when someone buys
      </h3>
      <p className="mt-1 text-[var(--muted-foreground)]">
        Smitvi charges a {commissionPct}% platform fee on each paid marketplace
        order. The rest is your seller payout (shown in{" "}
        <Link href={ROUTES.marketplaceOrders} className="text-[var(--accent)] hover:underline">
          Orders
        </Link>
        ).
      </p>

      <dl className="mt-4 space-y-2 rounded-lg border border-[var(--border)] bg-[var(--background)]/50 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--muted-foreground)]">Buyer pays</dt>
          <dd className="font-medium tabular-nums">{formatUsd(grossCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--muted-foreground)]">
            Platform fee ({commissionPct}%)
          </dt>
          <dd className="tabular-nums text-[var(--muted)]">
            −{formatUsd(split.commissionCents)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-2">
          <dt className="font-medium text-[var(--foreground)]">You receive</dt>
          <dd className="font-semibold tabular-nums text-[var(--accent)]">
            {formatUsd(split.netAmountCents)}
          </dd>
        </div>
      </dl>

      <ul className="mt-4 list-inside list-disc space-y-1 text-xs text-[var(--muted)]">
        <li>Checkout is handled by Stripe or Razorpay — buyers pay in the currency you set on the listing.</li>
        <li>Listings go live as ACTIVE and appear on the public marketplace immediately after publish.</li>
        <li>Paid orders show net earnings per sale; consult bookings may use separate flows.</li>
      </ul>
    </div>
  );
}
