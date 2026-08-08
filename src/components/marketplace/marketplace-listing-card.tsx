import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { formatListingPrice } from "@/components/marketplace/format-listing-price";
import {
  MARKETPLACE_LISTING_TYPE_LABELS,
  ROUTES,
} from "@/config/constants";
import { cn } from "@/lib/utils";

type SellerInfo = {
  displayName: string;
  username: string;
  avatarUrl?: string | null;
};

type MarketplaceListingCardProps = {
  id: string;
  type: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  seller: SellerInfo;
  /** Example/demo offers link to sample detail pages. */
  example?: boolean;
  actions: ReactNode;
  className?: string;
};

function listingTypeLabel(type: string): string {
  return (
    MARKETPLACE_LISTING_TYPE_LABELS[
      type as keyof typeof MARKETPLACE_LISTING_TYPE_LABELS
    ] ?? type.replaceAll("_", " ")
  );
}

export function MarketplaceListingCard({
  id,
  type,
  title,
  description,
  priceCents,
  currency,
  seller,
  example,
  actions,
  className,
}: MarketplaceListingCardProps) {
  const titleHref = example ? ROUTES.exampleListing(id) : undefined;
  const typeLabel = listingTypeLabel(type);

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-4 shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--glass-shadow)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Avatar
            src={seller.avatarUrl}
            name={seller.displayName}
            className="h-9 w-9"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{seller.displayName}</p>
            <p className="truncate text-xs text-[var(--muted)]">
              @{seller.username}
            </p>
          </div>
        </div>
        {example ? (
          <span className="shrink-0 rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--accent)] uppercase">
            Example
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-[10px] font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
        {typeLabel}
      </p>

      {titleHref ? (
        <h2 className="mt-1 font-display text-base font-semibold leading-snug">
          <Link href={titleHref} className="hover:text-[var(--accent)]">
            {title}
          </Link>
        </h2>
      ) : (
        <h2 className="mt-1 font-display text-base font-semibold leading-snug">
          {title}
        </h2>
      )}

      <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-snug text-[var(--muted-foreground)]">
        {description}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border)]/80 pt-3">
        <p className="font-display text-lg font-bold tabular-nums">
          {formatListingPrice(priceCents, currency)}
        </p>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">{actions}</div>
      </div>
    </article>
  );
}
