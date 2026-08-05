"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CircleDollarSign,
  MessageSquareQuote,
  Users,
} from "lucide-react";
import type { NetworkHomeViewModel } from "@/application/network/get-network-home";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

type NetworkHomeExploreProps = NetworkHomeViewModel;

const TABS = [
  {
    id: "experts",
    label: "Experts",
    description: "Intelligence Hubs you can follow and chat with",
    icon: Users,
  },
  {
    id: "knowledge",
    label: "Knowledge",
    description: "What experts are publishing on the network",
    icon: BookOpen,
  },
  {
    id: "earn",
    label: "Earn",
    description: "Questions, income, and marketplace momentum",
    icon: CircleDollarSign,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function NetworkHomeExplore(props: NetworkHomeExploreProps) {
  const [active, setActive] = useState<TabId>("experts");
  const activeMeta = TABS.find((tab) => tab.id === active)!;

  const showFeaturedNote =
    !props.hasLiveExperts && !props.hasLiveKnowledge && !props.hasLiveEarners;

  return (
    <section
      id="network"
      className="border-t border-[var(--border)] bg-[var(--background)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
            Explore the network
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Human intelligence you can search, chat with, and learn from
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--muted-foreground)]">
            Browse real Intelligence Hubs when they exist — plus featured
            examples so this page is never empty.
          </p>
        </div>

        {showFeaturedNote ? (
          <p className="mt-6 text-sm text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">
              Featured examples
            </span>{" "}
            until more creators go live.{" "}
            <Link
              href={ROUTES.signup}
              className="font-semibold text-[var(--accent)] hover:underline"
            >
              Launch your hub
            </Link>
          </p>
        ) : null}

        {/* Tab control */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="inline-flex w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1 sm:w-auto"
            role="tablist"
            aria-label="Network categories"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-initial",
                    selected
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <Button asChild variant="ghost" className="shrink-0 self-start sm:self-auto">
            <Link href={ROUTES.discover}>
              Full Discover
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-sm text-[var(--muted)]">{activeMeta.description}</p>

        {/* Panel */}
        <div
          className="mt-8 min-h-[22rem] rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)]/80 p-6 sm:p-8"
          role="tabpanel"
        >
          {active === "experts" ? (
            <ExpertsPanel {...props} />
          ) : null}
          {active === "knowledge" ? (
            <KnowledgePanel {...props} />
          ) : null}
          {active === "earn" ? (
            <EarnPanel {...props} />
          ) : null}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--accent-soft)]/30 px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg font-bold">
              Turn your expertise into an Intelligence Hub
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Train your AI · get discovered · earn while you sleep
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={ROUTES.signup}>
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ExpertsPanel(props: NetworkHomeExploreProps) {
  return (
    <div className="space-y-10">
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">Trending hubs</h3>
          <Link
            href={ROUTES.discover}
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            View all
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {props.trendingExperts.slice(0, 4).map((expert) => (
            <li key={expert.username}>
              <Link href={ROUTES.publicProfile(expert.username)}>
                <GlassCard className="flex gap-4 p-4 transition-colors hover:bg-[var(--surface-elevated)]">
                  <Avatar
                    src={expert.avatarUrl}
                    name={expert.displayName}
                    className="h-14 w-14 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold">{expert.displayName}</p>
                    <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                      @{expert.username}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-snug">
                      {expert.headline ?? expert.displayName}
                    </p>
                    {expert.followersCount != null && expert.followersCount > 0 ? (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {expert.followersCount} followers
                      </p>
                    ) : null}
                  </div>
                </GlassCard>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">New on Smitvi</h3>
        <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--glass)]">
          {props.topCreators.slice(0, 5).map((creator) => (
            <li key={creator.username}>
              <Link
                href={ROUTES.publicProfile(creator.username)}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-elevated)]"
              >
                <Avatar
                  src={creator.avatarUrl}
                  name={creator.displayName}
                  className="h-9 w-9"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {creator.displayName}
                  </p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    @{creator.username}
                  </p>
                </div>
                <span className="text-xs font-medium text-[var(--accent)]">
                  View hub
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function KnowledgePanel(props: NetworkHomeExploreProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <h3 className="mb-4 font-display text-lg font-semibold">
          Latest published intelligence
        </h3>
        <ul className="space-y-4">
          {props.latestIntelligence.slice(0, 4).map((item) => (
            <li key={item.id}>
              <GlassCard className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                  @{item.ownerDisplayName}
                </p>
                <p className="mt-2 text-lg font-semibold leading-snug">
                  {item.title}
                </p>
                {item.summary ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {item.summary}
                  </p>
                ) : null}
                <Link
                  href={ROUTES.publicProfile(item.ownerUsername)}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  Open hub
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </GlassCard>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-4 font-display text-lg font-semibold">
          Topics gaining traction
        </h3>
        <ul className="space-y-2">
          {props.trendingTopics.slice(0, 8).map((topic, index) => (
            <li key={topic.topic}>
              <Link
                href={`${ROUTES.search}?q=${encodeURIComponent(topic.topic)}`}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--surface-elevated)]"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
                    {index + 1}
                  </span>
                  <span className="truncate text-sm font-medium">
                    {topic.topic}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-[var(--muted)]">
                  {topic.sourceCount} sources
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Button asChild variant="secondary" className="mt-6 w-full">
          <Link href={ROUTES.search}>Search all knowledge</Link>
        </Button>
      </div>
    </div>
  );
}

function EarnPanel(props: NetworkHomeExploreProps) {
  const story = props.successStories[0];

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <MessageSquareQuote className="h-5 w-5 text-[var(--accent)]" />
          Questions people are asking
        </h3>
        <ul className="space-y-3">
          {props.openQuestions.slice(0, 4).map((q, index) => (
            <li key={`${q.ownerUsername}-${index}`}>
              <GlassCard className="p-4">
                <p className="text-sm font-medium leading-relaxed">
                  {q.question}
                </p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Topic: {q.topic}
                </p>
                <Link
                  href={ROUTES.publicTwinChat(q.ownerUsername)}
                  className="mt-2 inline-block text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  Ask @{q.ownerUsername}&apos;s Twin
                </Link>
              </GlassCard>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="mb-4 font-display text-lg font-semibold">
            Top earners on the marketplace
          </h3>
          <ul className="space-y-2">
            {props.topEarners.slice(0, 5).map((earner, index) => (
              <li key={earner.username}>
                <Link href={ROUTES.publicProfile(earner.username)}>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--glass)] px-4 py-3 transition-colors hover:bg-[var(--surface-elevated)]">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-sm font-bold tabular-nums text-[var(--muted)]">
                        {index + 1}.
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {earner.displayName}
                        </p>
                        <p className="truncate text-xs text-[var(--muted-foreground)]">
                          {earner.headline}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[var(--accent)]">
                      {earner.earningsLabel}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild variant="secondary" className="mt-4 w-full">
            <Link href={ROUTES.marketplace}>Browse marketplace</Link>
          </Button>
        </div>

        {story ? (
          <GlassCard className="border-[var(--accent)]/20 bg-[var(--accent-soft)]/20 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
              Creator story
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">
              &ldquo;{story.quote}&rdquo;
            </p>
            <p className="mt-3 text-sm font-semibold">{story.name}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {story.metric}
            </p>
          </GlassCard>
        ) : null}
      </div>
    </div>
  );
}
