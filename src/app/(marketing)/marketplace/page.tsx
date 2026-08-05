import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { PageHero } from "@/components/layout/page-hero";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { BuyButton } from "@/components/marketplace/buy-button";
import { DEMO_MARKETPLACE_LISTINGS } from "@/config/demo-content";
import {
  MARKETPLACE_COMMISSION_RATE,
  MARKETPLACE_LISTING_TYPE_LABELS,
  ROUTES,
} from "@/config/constants";
import { hubProfileHref } from "@/lib/hub-links";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Hire consultations and buy knowledge packs from Smitvi experts.",
};

export default async function MarketplacePage() {
  const [liveListings, session] = await Promise.all([
    container.marketplace.listActive(),
    getCurrentSession(),
  ]);
  const usingDemo = liveListings.length === 0;
  const sellHref = session
    ? ROUTES.marketplaceSell
    : `${ROUTES.login}?next=${encodeURIComponent(ROUTES.marketplaceSell)}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <PageHero
          eyebrow="Marketplace"
          title="Expert marketplace"
          description={`Hire consultations and buy knowledge packs. Smitvi takes a ${Math.round(MARKETPLACE_COMMISSION_RATE * 100)}% platform fee so experts can monetize their intelligence.`}
        />
        <Button asChild size="lg" className="shrink-0 animate-fade-up-delay-1">
          <Link href={sellHref}>Sell on Smitvi</Link>
        </Button>
      </div>

      {usingDemo ? (
        <p className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-3 text-sm text-[var(--muted-foreground)]">
          Example offers to show how the marketplace looks.{" "}
          <Link
            href={sellHref}
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            Publish a real listing →
          </Link>
        </p>
      ) : null}

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {usingDemo
          ? DEMO_MARKETPLACE_LISTINGS.map((listing, index) => (
              <GlassCard
                key={listing.id}
                className={`flex flex-col p-6 transition-transform duration-300 hover:-translate-y-0.5 ${index < 2 ? "animate-fade-up-delay-1" : "animate-fade-up-delay-2"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={listing.seller.displayName}
                      src={null}
                    />
                    <div>
                      <p className="font-semibold">
                        <Link
                          href={hubProfileHref(listing.seller.username, false)}
                          className="hover:text-[var(--accent)]"
                        >
                          {listing.seller.displayName}
                        </Link>
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        @{listing.seller.username}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-semibold tracking-wide text-[var(--accent)] uppercase">
                    Example
                  </span>
                </div>
                <p className="mt-5 text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
                  {MARKETPLACE_LISTING_TYPE_LABELS[
                    listing.type as keyof typeof MARKETPLACE_LISTING_TYPE_LABELS
                  ] ?? listing.type.replaceAll("_", " ")}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold">
                  <Link
                    href={ROUTES.exampleListing(listing.id)}
                    className="hover:text-[var(--accent)]"
                  >
                    {listing.title}
                  </Link>
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
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {session ? (
                    <Button asChild className="w-full sm:flex-1" variant="secondary">
                      <Link href={ROUTES.marketplaceSell}>
                        Publish a listing to sell
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full sm:flex-1" variant="secondary">
                      <Link
                        href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.marketplace)}`}
                      >
                        Sign in to buy
                      </Link>
                    </Button>
                  )}
                  <Button asChild className="w-full sm:flex-1" variant="ghost">
                    <Link href={ROUTES.exampleListing(listing.id)}>
                      View offer details
                    </Link>
                  </Button>
                </div>
              </GlassCard>
            ))
          : liveListings.map((listing, index) => {
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
                    {MARKETPLACE_LISTING_TYPE_LABELS[
                      listing.type as keyof typeof MARKETPLACE_LISTING_TYPE_LABELS
                    ] ?? listing.type.replaceAll("_", " ")}
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
                    {session ? (
                      <BuyButton listingId={listing.id} />
                    ) : (
                      <Button asChild className="w-full">
                        <Link
                          href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.marketplace)}`}
                        >
                          Sign in to buy
                        </Link>
                      </Button>
                    )}
                  </div>
                </GlassCard>
              );
            })}
      </div>
    </div>
  );
}
