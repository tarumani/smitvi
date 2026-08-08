import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_COMMISSION_RATE } from "@/config/constants";

type Props = {
  sellHref: string;
  usingDemo: boolean;
};

export function MarketplacePageHeader({ sellHref, usingDemo }: Props) {
  const feePct = Math.round(MARKETPLACE_COMMISSION_RATE * 100);

  return (
    <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
          Marketplace
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Expert offers
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
          Consultations and knowledge packs from Smitvi experts · {feePct}% platform
          fee
          {usingDemo ? " · sample listings below until sellers publish live offers" : null}
        </p>
      </div>
      <Button asChild size="sm" className="shrink-0 sm:h-10">
        <Link href={sellHref}>Sell on Smitvi</Link>
      </Button>
    </header>
  );
}
