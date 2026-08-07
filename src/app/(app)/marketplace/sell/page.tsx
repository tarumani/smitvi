import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { LaunchWizardReturnBanner } from "@/components/dashboard/launch-wizard-return-banner";
import { ListingForm } from "@/components/marketplace/listing-form";
import { SellerListingsPanel } from "@/components/marketplace/seller-listings-panel";
import { MarketplacePayoutExplainer } from "@/components/marketplace/marketplace-payout-explainer";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Sell on marketplace",
};

type PageProps = {
  searchParams: Promise<{ first?: string; from?: string }>;
};

export default async function MarketplaceSellPage({ searchParams }: PageProps) {
  const { from, first } = await searchParams;
  if (first === "1") {
    redirect(ROUTES.marketplaceSellFirst);
  }
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const userId = session.user.id;
  const listings = await container.marketplace.listBySeller(userId);
  const activeListings = listings.filter((l) => l.status === "ACTIVE");
  const isFirstListing = activeListings.length === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {from === "launch" ? <LaunchWizardReturnBanner step="monetize" /> : null}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {isFirstListing ? "Publish your first offer" : "Sell your expertise"}
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          {isFirstListing
            ? "Turn your Twin and expertise into something buyers can purchase today."
            : "Publish consultations, service packages, and knowledge packs."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[7fr_3fr] lg:items-stretch">
        <GlassCard className="flex h-full flex-col p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-wide text-[var(--accent)] uppercase">
            Your listing
          </p>
          <h2 className="mt-1 font-display text-lg font-bold tracking-tight">
            {isFirstListing ? "Publish your offer" : "Add or edit"}
          </h2>
          <div className="mt-5 flex-1">
            <ListingForm />
          </div>
        </GlassCard>

        <MarketplacePayoutExplainer />
      </div>

      {listings.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Your listings</h2>
          <SellerListingsPanel
            listings={listings.map((listing) => ({
              id: listing.id,
              type: listing.type,
              title: listing.title,
              description: listing.description,
              status: listing.status,
              priceCents: listing.priceCents,
              currency: listing.currency,
              durationMinutes: listing.durationMinutes,
            }))}
          />
        </section>
      ) : null}
    </div>
  );
}
