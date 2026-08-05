import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ListingForm } from "@/components/marketplace/listing-form";
import { GlassCard } from "@/components/ui/glass-card";
import { MARKETPLACE_COMMISSION_RATE, ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Sell on marketplace",
};

export default async function MarketplaceSellPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const listings = await container.marketplace.listBySeller(session.user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Sell your expertise
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Publish consultations, service packages, and knowledge packs. Platform
          commission: {Math.round(MARKETPLACE_COMMISSION_RATE * 100)}%.
        </p>
      </div>

      <GlassCard className="p-6">
        <ListingForm />
      </GlassCard>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Your listings</h2>
        {listings.length === 0 ? (
          <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
            No listings yet.
          </GlassCard>
        ) : (
          listings.map((listing) => (
            <GlassCard key={listing.id} className="p-4">
              <p className="font-semibold">{listing.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {listing.status} · ${(listing.priceCents / 100).toFixed(0)}{" "}
                {listing.currency}
              </p>
            </GlassCard>
          ))
        )}
      </section>
    </div>
  );
}
