"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "knowledge", label: "Knowledge" },
  { id: "chat", label: "Chat" },
  { id: "offers", label: "Offers" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type OfferItem = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  type: string;
};

type IntelligenceHubTabsProps = {
  username: string;
  publicTwinEnabled: boolean;
  overview: React.ReactNode;
  knowledge: React.ReactNode;
  offers: OfferItem[];
};

export function IntelligenceHubTabs({
  username,
  publicTwinEnabled,
  overview,
  knowledge,
  offers,
}: IntelligenceHubTabsProps) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === item.id
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--surface)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? overview : null}

      {tab === "knowledge" ? knowledge : null}

      {tab === "chat" ? (
        <GlassCard className="space-y-4 p-6">
          <h2 className="font-display text-xl font-semibold">Twin Chat</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Ask questions grounded in this hub&apos;s public knowledge.
          </p>
          {publicTwinEnabled ? (
            <Button asChild>
              <Link href={ROUTES.publicTwinChat(username)}>Open chat</Link>
            </Button>
          ) : (
            <p className="text-sm text-[var(--muted)]">Twin chat is unavailable.</p>
          )}
        </GlassCard>
      ) : null}

      {tab === "offers" ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Offers</h2>
          {offers.length === 0 ? (
            <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
              No marketplace offers yet.
            </GlassCard>
          ) : (
            offers.map((listing) => (
              <GlassCard key={listing.id} className="p-5">
                <p className="font-semibold">{listing.title}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[var(--muted)]">
                  {listing.type.replace(/_/g, " ")}
                </p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {listing.description}
                </p>
                <p className="mt-3 text-sm font-medium">
                  ${(listing.priceCents / 100).toFixed(0)} {listing.currency}
                </p>
              </GlassCard>
            ))
          )}
        </section>
      ) : null}
    </div>
  );
}
