"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { calculateMarketplaceSplit } from "@/config/billing";
import { MARKETPLACE_COMMISSION_RATE, ROUTES } from "@/config/constants";
import { GlassCard } from "@/components/ui/glass-card";

type Props = {
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
  const keepPct = 100 - commissionPct;

  return (
    <GlassCard
      className={`flex h-full flex-col border-[var(--border)] p-5 sm:p-6 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Wallet className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
            Example payout
          </p>
          <h3 className="font-display text-lg font-bold tracking-tight">
            What you keep
          </h3>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
        {commissionPct}% platform fee on paid orders. Net earnings appear in{" "}
        <Link href={ROUTES.marketplaceOrders} className="text-[var(--accent)] hover:underline">
          Orders
        </Link>
        .
      </p>

      <div className="mt-5 flex flex-1 flex-col justify-center rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent-soft)]/30 px-4 py-5 text-center">
        <p className="text-xs font-medium text-[var(--muted-foreground)]">
          On a {formatUsd(grossCents)} sale you receive
        </p>
        <p className="mt-1 font-display text-4xl font-bold tabular-nums tracking-tight text-[var(--accent)]">
          {formatUsd(split.netAmountCents)}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {keepPct}% after fees
        </p>
      </div>

      <dl className="mt-4 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 px-3 py-2.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted-foreground)]">Buyer pays</dt>
          <dd className="font-medium tabular-nums">{formatUsd(grossCents)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted-foreground)]">Platform ({commissionPct}%)</dt>
          <dd className="tabular-nums text-[var(--muted)]">
            −{formatUsd(split.commissionCents)}
          </dd>
        </div>
      </dl>

      <ul className="mt-4 space-y-1.5 text-[11px] leading-snug text-[var(--muted)]">
        <li>Stripe or Razorpay checkout · listing goes live as ACTIVE</li>
        <li>Numbers above are an example — set your own price on the form →</li>
      </ul>
    </GlassCard>
  );
}
