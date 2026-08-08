import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { Button } from "@/components/ui/button";
import { BuyButton } from "@/components/marketplace/buy-button";
import { MarketplaceAside } from "@/components/marketplace/marketplace-aside";
import { MarketplaceListingCard } from "@/components/marketplace/marketplace-listing-card";
import { MarketplacePageHeader } from "@/components/marketplace/marketplace-page-header";
import { DEMO_MARKETPLACE_LISTINGS } from "@/config/demo-content";
import { DEMO_TOP_EARNERS } from "@/config/network-home-demo";
import { ROUTES } from "@/config/constants";
import { formatInrFromMinorUnits } from "@/lib/format-money";

const MARKETPLACE_HOME_LISTING_LIMIT = 2;

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Hire consultations and buy knowledge packs from Smitvi experts.",
};

export default async function MarketplacePage() {
  const [liveListings, liveEarners, session] = await Promise.all([
    container.marketplace.listActive(),
    container.marketplace.topEarners(5),
    getCurrentSession(),
  ]);
  const usingDemo = liveListings.length === 0;
  const hasLiveEarners = liveEarners.length > 0;
  const topEarners = hasLiveEarners
    ? liveEarners.map((e) => ({
        username: e.username,
        displayName: e.displayName,
        headline: e.headline,
        earningsLabel: formatInrFromMinorUnits(e.netEarningsCents),
      }))
    : DEMO_TOP_EARNERS.map((e) => ({
        username: e.username,
        displayName: e.displayName,
        headline: e.headline,
        earningsLabel: e.earningsLabel,
      }));
  const demoListings = DEMO_MARKETPLACE_LISTINGS.slice(
    0,
    MARKETPLACE_HOME_LISTING_LIMIT,
  );
  const visibleLiveListings = liveListings.slice(
    0,
    MARKETPLACE_HOME_LISTING_LIMIT,
  );
  const sellHref = session
    ? ROUTES.marketplaceSell
    : `${ROUTES.login}?next=${encodeURIComponent(ROUTES.marketplaceSell)}`;
  const loginNext = `${ROUTES.login}?next=${encodeURIComponent(ROUTES.marketplace)}`;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <MarketplacePageHeader sellHref={sellHref} usingDemo={usingDemo} />

      {usingDemo ? (
        <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-2 text-sm text-[var(--muted-foreground)]">
          <Link href={sellHref} className="font-semibold text-[var(--accent)] hover:underline">
            Publish a real listing
          </Link>{" "}
          to replace these examples.
        </p>
      ) : null}

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-3 lg:items-start">
        <section
          aria-label="Marketplace listings"
          className="min-w-0 lg:col-span-2"
        >
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
            {usingDemo ? "Example offers" : "Featured offers"}
          </h2>

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {usingDemo
              ? demoListings.map((listing) => (
                  <MarketplaceListingCard
                    key={listing.id}
                    id={listing.id}
                    type={listing.type}
                    title={listing.title}
                    description={listing.description}
                    priceCents={listing.priceCents}
                    currency={listing.currency}
                    seller={{
                      displayName: listing.seller.displayName,
                      username: listing.seller.username,
                    }}
                    example
                    actions={
                      <>
                        {session ? (
                          <Button asChild size="sm" variant="secondary">
                            <Link href={ROUTES.marketplaceSell}>Sell</Link>
                          </Button>
                        ) : (
                          <Button asChild size="sm">
                            <Link href={loginNext}>Sign in</Link>
                          </Button>
                        )}
                        <Button asChild size="sm" variant="ghost">
                          <Link href={ROUTES.exampleListing(listing.id)}>
                            Details
                          </Link>
                        </Button>
                      </>
                    }
                  />
                ))
              : visibleLiveListings.map((listing) => {
                  const seller = listing.seller.profile;
                  return (
                    <MarketplaceListingCard
                      key={listing.id}
                      id={listing.id}
                      type={listing.type}
                      title={listing.title}
                      description={listing.description}
                      priceCents={listing.priceCents}
                      currency={listing.currency}
                      seller={{
                        displayName: seller?.displayName ?? "Expert",
                        username: seller?.username ?? "unknown",
                        avatarUrl: seller?.avatarUrl,
                      }}
                      actions={
                        session ? (
                          <BuyButton
                            listingId={listing.id}
                            size="sm"
                            className="shrink-0"
                          />
                        ) : (
                          <Button asChild size="sm">
                            <Link href={loginNext}>Sign in to buy</Link>
                          </Button>
                        )
                      }
                    />
                  );
                })}
          </div>
        </section>

        <MarketplaceAside
          earners={topEarners}
          hasLiveEarners={hasLiveEarners}
          sellHref={sellHref}
        />
      </div>
    </div>
  );
}
