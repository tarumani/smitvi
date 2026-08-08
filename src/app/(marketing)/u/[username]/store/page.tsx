import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { container } from "@/application/container";
import { ROUTES } from "@/config/constants";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { BuyButton } from "@/components/marketplace/buy-button";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username} store` };
}

export default async function CreatorStorePage({ params }: Props) {
  const { username } = await params;
  const profile = await container.profiles.findByUsername(username);
  if (!profile || profile.visibility === "PRIVATE") notFound();

  const listings = await container.marketplace.listActiveBySeller(profile.userId);
  const twinSettings = await container.twinMonetization.getSettings(
    profile.userId,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div>
        <Link
          href={ROUTES.publicProfile(username)}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← {profile.displayName}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold">Store</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Products and AI access from this Intelligence Hub.
        </p>
      </div>

      <GlassCard className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-semibold">Ask AI Expert</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            {twinSettings.enabled && twinSettings.accessMode !== "FREE"
              ? "Paid or subscription access may apply."
              : "Free Twin chat when enabled on profile."}
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.publicTwinChat(username)}>Ask AI</Link>
        </Button>
      </GlassCard>

      <section>
        <h2 className="font-display text-xl font-semibold">Products</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {listings.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              No products published yet.
            </p>
          ) : (
            listings.map((listing) => (
              <GlassCard key={listing.id} className="p-5">
                <p className="text-xs font-semibold text-[var(--accent)]">
                  {listing.type.replace(/_/g, " ")}
                </p>
                <h3 className="mt-1 font-semibold">{listing.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-[var(--muted-foreground)]">
                  {listing.description}
                </p>
                <div className="mt-4">
                  <BuyButton listingId={listing.id} />
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </section>

      <Button asChild variant="outline">
        <Link href={`${ROUTES.publicProfile(username)}#hub-tab-book`}>
          Book consultation
        </Link>
      </Button>
    </div>
  );
}
