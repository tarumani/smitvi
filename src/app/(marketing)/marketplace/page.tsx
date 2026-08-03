import type { Metadata } from "next";
import Link from "next/link";
import { Store } from "lucide-react";
import { container } from "@/application/container";
import { PageHero } from "@/components/layout/page-hero";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { BuyButton } from "@/components/marketplace/buy-button";
import { MARKETPLACE_COMMISSION_RATE, ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Hire consultations and buy knowledge packs from Smitvi experts.",
};

export default async function MarketplacePage() {
  const listings = await container.marketplace.listActive();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <PageHero
          eyebrow="Marketplace"
          title="Expert marketplace"
          description={`Hire consultations and buy knowledge packs. Smitvi takes a ${Math.round(MARKETPLACE_COMMISSION_RATE * 100)}% platform fee so experts can monetize their intelligence.`}
        />
        <Button asChild size="lg" className="shrink-0 animate-fade-up-delay-1">
          <Link href={ROUTES.marketplaceSell}>Sell on Smitvi</Link>
        </Button>
      </div>

      {listings.length > 0 ? (
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {listings.map((listing, index) => {
            const seller = listing.seller.profile;
            return (
              <GlassCard
                key={listing.id}
                className={`flex flex-col p-6 transition-transform duration-300 hover:-translate-y-0.5 ${index < 2 ? "animate-fade-up-delay-1" : "animate-fade-up-delay-2"}`}
              >
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
                <p className="mt-5 text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
                  {listing.type.replaceAll("_", " ")}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold">
                  {listing.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {listing.description}
                </p>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <p className="font-display text-3xl font-bold">
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
      ) : (
        <div className="mt-12 animate-fade-up-delay-1">
          <EmptyState
            icon={<Store className="h-9 w-9 text-[var(--accent)]" />}
            title="No marketplace listings yet"
            description="Be the first expert to publish a consultation or knowledge pack on Smitvi."
            action={
              <Button asChild>
                <Link href={ROUTES.marketplaceSell}>Publish an offer</Link>
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
