import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/application/container";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { BuyButton } from "@/components/marketplace/buy-button";
import { MARKETPLACE_COMMISSION_RATE, ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Marketplace",
};

export default async function MarketplacePage() {
  const listings = await container.marketplace.listActive();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Expert marketplace
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
            Hire consultations and buy knowledge packs. Smitvi takes a{" "}
            {Math.round(MARKETPLACE_COMMISSION_RATE * 100)}% platform fee.
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.marketplaceSell}>Sell on Smitvi</Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {listings.map((listing) => {
          const seller = listing.seller.profile;
          return (
            <GlassCard key={listing.id} className="flex flex-col p-5">
              <div className="flex items-center gap-3">
                <Avatar
                  src={seller?.avatarUrl}
                  name={seller?.displayName ?? "Expert"}
                />
                <div>
                  <p className="font-semibold">
                    {seller?.displayName ?? "Expert"}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    @{seller?.username ?? "unknown"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
                {listing.type.replaceAll("_", " ")}
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold">
                {listing.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-[var(--muted-foreground)]">
                {listing.description}
              </p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="font-display text-2xl font-bold">
                  ${(listing.priceCents / 100).toFixed(0)}
                  <span className="text-sm font-medium text-[var(--muted)]">
                    {" "}
                    {listing.currency}
                  </span>
                </p>
              </div>
              <div className="mt-4">
                <BuyButton listingId={listing.id} />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {listings.length === 0 ? (
        <GlassCard className="mt-8 p-6 text-sm text-[var(--muted-foreground)]">
          No marketplace listings yet. Be the first expert to publish an offer.
        </GlassCard>
      ) : null}
    </div>
  );
}
