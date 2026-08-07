import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { FirstListingWizard } from "@/components/marketplace/first-listing-wizard";
import { ListingForm } from "@/components/marketplace/listing-form";
import { SellerListingsPanel } from "@/components/marketplace/seller-listings-panel";
import { MarketplacePayoutExplainer } from "@/components/marketplace/marketplace-payout-explainer";
import { GlassCard } from "@/components/ui/glass-card";
import { defaultFirstListingTemplate } from "@/config/marketplace-listing-templates";
import { ROUTES } from "@/config/constants";
import { prisma } from "@/infrastructure/database/prisma";

export const metadata: Metadata = {
  title: "Sell on marketplace",
};

type PageProps = {
  searchParams: Promise<{ first?: string }>;
};

export default async function MarketplaceSellPage({ searchParams }: PageProps) {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const { first } = await searchParams;
  const userId = session.user.id;
  const listings = await container.marketplace.listBySeller(userId);
  const activeListings = listings.filter((l) => l.status === "ACTIVE");
  const showWizard =
    first === "1" || activeListings.length === 0;

  const profileRow = await prisma.profile.findUnique({
    where: { userId },
    select: {
      displayName: true,
      profession: true,
      headline: true,
      bio: true,
    },
  });

  const wizardProfile = {
    displayName: profileRow?.displayName ?? session.profile.displayName,
    profession: profileRow?.profession ?? null,
    headline: profileRow?.headline ?? null,
    bio: profileRow?.bio ?? null,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {showWizard ? "Publish your first offer" : "Sell your expertise"}
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          {showWizard
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
            {showWizard ? "Publish your offer" : "Add or edit"}
          </h2>
          <div className="mt-5 flex-1">
            {showWizard ? (
              <FirstListingWizard
                profile={wizardProfile}
                initialTemplateId={defaultFirstListingTemplate(wizardProfile)}
              />
            ) : (
              <ListingForm />
            )}
          </div>
        </GlassCard>

        <MarketplacePayoutExplainer />
      </div>

      {!showWizard || listings.length > 0 ? (
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
