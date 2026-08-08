"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  ListingForm,
  type ListingFormInitial,
} from "@/components/marketplace/listing-form";
import { MARKETPLACE_LISTING_TYPE_LABELS } from "@/config/constants";
import { readApiErrorMessage } from "@/lib/api-response";

type ListingRow = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priceCents: number;
  currency: string;
  durationMinutes: number | null;
};

export function SellerListingsPanel({ listings }: { listings: ListingRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ListingFormInitial | null>(null);
  const [isPending, startTransition] = useTransition();

  function deleteListing(listing: ListingRow) {
    if (
      !window.confirm(
        `Delete "${listing.title}"? It will be removed from the marketplace. Past orders are kept for your records.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/marketplace/listings/${listing.id}`, {
          method: "DELETE",
        });
        const json: unknown = await response.json();
        if (!response.ok) {
          throw new Error(readApiErrorMessage(json, "Could not delete listing"));
        }
        toast.success("Listing deleted");
        if (editing?.id === listing.id) {
          setEditing(null);
        }
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not delete listing",
        );
      }
    });
  }

  if (listings.length === 0) {
    return (
      <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
        No listings yet.
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {listings.map((listing) => {
        const isEditing = editing?.id === listing.id;
        const typeLabel =
          listing.type in MARKETPLACE_LISTING_TYPE_LABELS
            ? MARKETPLACE_LISTING_TYPE_LABELS[
                listing.type as keyof typeof MARKETPLACE_LISTING_TYPE_LABELS
              ]
            : listing.type.replaceAll("_", " ");

        if (isEditing) {
          return (
            <GlassCard key={listing.id} className="p-5 sm:p-6">
              <p className="mb-4 text-sm font-semibold text-[var(--accent)]">
                Edit listing
              </p>
              <ListingForm
                initialListing={{
                  id: listing.id,
                  type: listing.type as ListingFormInitial["type"],
                  title: listing.title,
                  description: listing.description,
                  priceCents: listing.priceCents,
                  durationMinutes: listing.durationMinutes,
                  currency: listing.currency,
                }}
                onCancelEdit={() => setEditing(null)}
              />
            </GlassCard>
          );
        }

        return (
          <GlassCard key={listing.id} className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--muted)]">
                  {typeLabel} · {listing.status}
                </p>
                <p className="mt-1 font-semibold">{listing.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                  {listing.description}
                </p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  ${(listing.priceCents / 100).toFixed(0)} {listing.currency}
                  {listing.durationMinutes
                    ? ` · ${listing.durationMinutes} min`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    setEditing({
                      id: listing.id,
                      type: listing.type as ListingFormInitial["type"],
                      title: listing.title,
                      description: listing.description,
                      priceCents: listing.priceCents,
                      durationMinutes: listing.durationMinutes,
                      currency: listing.currency,
                    })
                  }
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                  onClick={() => deleteListing(listing)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
