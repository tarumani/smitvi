import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  DEMO_MARKETPLACE_LISTINGS,
  type DemoListing,
} from "@/config/demo-content";
import {
  MARKETPLACE_LISTING_TYPE_LABELS,
  ROUTES,
} from "@/config/constants";
import { hubProfileHref } from "@/lib/hub-links";

function findDemoListing(id: string): DemoListing | undefined {
  return DEMO_MARKETPLACE_LISTINGS.find((listing) => listing.id === id);
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = findDemoListing(id);
  if (!listing) return { title: "Example listing" };
  return {
    title: `${listing.title} — Example offer`,
    description: listing.description,
  };
}

export default async function ExampleListingPage({ params }: PageProps) {
  const { id } = await params;
  const listing = findDemoListing(id);
  if (!listing) notFound();

  const typeLabel =
    MARKETPLACE_LISTING_TYPE_LABELS[
      listing.type as keyof typeof MARKETPLACE_LISTING_TYPE_LABELS
    ] ?? listing.type.replaceAll("_", " ");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/40 px-4 py-3 text-sm text-[var(--muted-foreground)]">
        <span className="font-semibold text-[var(--foreground)]">
          Example marketplace offer
        </span>{" "}
        — preview only. Sign in to buy live listings or publish your own.
      </p>

      <GlassCard className="mt-8 p-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
          {typeLabel}
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          {listing.title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {listing.description}
        </p>
        <p className="mt-8 font-display text-4xl font-bold">
          ${(listing.priceCents / 100).toFixed(0)}
          <span className="text-base font-medium text-[var(--muted)]">
            {" "}
            {listing.currency}
          </span>
        </p>
        <p className="mt-6 text-sm">
          Sold by{" "}
          <Link
            href={hubProfileHref(listing.seller.username, false)}
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            {listing.seller.displayName}
          </Link>{" "}
          (@{listing.seller.username})
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={ROUTES.signup}>Create your offer</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={ROUTES.marketplace}>Live marketplace</Link>
          </Button>
        </div>
      </GlassCard>

      <p className="mt-10 text-sm text-[var(--muted)]">
        <Link href={ROUTES.home} className="text-[var(--accent)] hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
