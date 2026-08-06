"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  Bot,
  CalendarDays,
  Link2,
  Rss,
  ShoppingBag,
  Star,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";
import {
  HubActivityFeed,
  type HubActivityItem,
} from "@/components/profile/hub-activity-feed";

const TABS = [
  { id: "overview", label: "Overview", icon: UserRound },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "ask", label: "Ask", icon: Bot },
  { id: "book", label: "Book", icon: CalendarDays },
  { id: "offers", label: "Offers", icon: ShoppingBag },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "connect", label: "Connect", icon: Link2 },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_IDS = new Set<string>(TABS.map((t) => t.id));

function tabFromHash(): TabId | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw.startsWith("hub-tab-")) return null;
  const id = raw.slice("hub-tab-".length);
  return TAB_IDS.has(id) ? (id as TabId) : null;
}

type OfferItem = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  type: string;
};

type HubEngagementBarProps = {
  username: string;
  publicTwinEnabled: boolean;
  hasConsultation: boolean;
  offerCount: number;
  isOwner: boolean;
  showFollow: boolean;
  followSlot: React.ReactNode;
};

export function HubEngagementBar({
  username,
  publicTwinEnabled,
  hasConsultation,
  offerCount,
  isOwner,
  showFollow,
  followSlot,
}: HubEngagementBarProps) {
  if (isOwner) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-3">
      {showFollow ? followSlot : null}
      {publicTwinEnabled ? (
        <Button asChild size="sm">
          <Link href={ROUTES.publicTwinChat(username)}>
            <Bot className="h-4 w-4" />
            Ask the Twin
          </Link>
        </Button>
      ) : null}
      {hasConsultation ? (
        <Button asChild size="sm" variant="secondary">
          <a href="#hub-tab-book" className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            Book a consult
          </a>
        </Button>
      ) : null}
      {offerCount > 0 ? (
        <Button asChild size="sm" variant="secondary">
          <a href="#hub-tab-offers" className="inline-flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            Shop offers ({offerCount})
          </a>
        </Button>
      ) : null}
      <Button asChild size="sm" variant="ghost">
        <a href="#hub-tab-activity" className="inline-flex items-center gap-1.5">
          <Rss className="h-4 w-4" />
          See activity
        </a>
      </Button>
    </div>
  );
}

type IntelligenceHubTabsProps = {
  username: string;
  publicTwinEnabled: boolean;
  overview: React.ReactNode;
  knowledge: React.ReactNode;
  book: React.ReactNode;
  reviews: React.ReactNode;
  connect: React.ReactNode;
  faqQuestions: string[];
  offers: OfferItem[];
  activityItems: HubActivityItem[];
  activityUpdatesBanner?: React.ReactNode;
};

export function IntelligenceHubTabs({
  username,
  publicTwinEnabled,
  overview,
  knowledge,
  book,
  reviews,
  connect,
  faqQuestions,
  offers,
  activityItems,
  activityUpdatesBanner,
}: IntelligenceHubTabsProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const chatHref = ROUTES.publicTwinChat(username);

  const selectTab = useCallback((id: TabId) => {
    setTab(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#hub-tab-${id}`);
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const fromHash = tabFromHash();
      if (fromHash) setTab(fromHash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const defaultPrompts = [
    "What are you best known for?",
    "Summarize your public expertise",
    "What should I ask before hiring you?",
  ];
  const prompts =
    faqQuestions.length > 0 ? faqQuestions.slice(0, 6) : defaultPrompts;

  return (
    <div className="mt-6 space-y-6">
      <div className="-mx-1 flex gap-2 overflow-x-auto border-b border-[var(--border)] pb-3 [scrollbar-width:thin]">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              id={`hub-tab-${item.id}`}
              onClick={() => selectTab(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors sm:px-4",
                tab === item.id
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--surface)]",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  tab === item.id
                    ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                    : "bg-[var(--surface)] text-[var(--muted-foreground)]",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "overview" ? overview : null}

      {tab === "activity" ? (
        <HubActivityFeed
          items={activityItems}
          updatesBanner={activityUpdatesBanner}
        />
      ) : null}

      {tab === "knowledge" ? knowledge : null}

      {tab === "ask" ? (
        <div className="space-y-6">
          <GlassCard className="space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">Ask the Twin</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Get answers grounded in this hub&apos;s public knowledge — with
              citations when available.
            </p>
            {publicTwinEnabled ? (
              <Button asChild size="lg">
                <Link href={chatHref}>Start Twin chat</Link>
              </Button>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Twin chat is not enabled on this hub yet.
              </p>
            )}
          </GlassCard>
          <section>
            <h3 className="text-sm font-semibold tracking-wide text-[var(--muted)] uppercase">
              Try asking
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {prompts.map((question) => (
                <li key={question}>
                  <Link
                    href={
                      publicTwinEnabled
                        ? ROUTES.publicTwinChatWithPrompt(username, question)
                        : "#"
                    }
                    className={cn(
                      "block rounded-xl border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-sm transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/40",
                      !publicTwinEnabled && "pointer-events-none opacity-50",
                    )}
                  >
                    {question}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {tab === "book" ? book : null}

      {tab === "offers" ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Marketplace offers</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Knowledge packs, templates, and services from this expert.
          </p>
          {offers.length === 0 ? (
            <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
              No marketplace offers yet. Follow this hub for updates.
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
                <Button asChild size="sm" className="mt-4" variant="secondary">
                  <Link href={ROUTES.marketplace}>View on marketplace</Link>
                </Button>
              </GlassCard>
            ))
          )}
        </section>
      ) : null}

      {tab === "reviews" ? reviews : null}
      {tab === "connect" ? connect : null}
    </div>
  );
}
