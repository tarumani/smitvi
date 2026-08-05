import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  MessageSquareQuote,
  Search,
  Sparkles,
  Tags,
  UserPlus,
} from "lucide-react";
import { container } from "@/application/container";
import { PageHero } from "@/components/layout/page-hero";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DEMO_DISCOVER_DOMAINS,
  DEMO_DISCOVER_GUIDES,
  DEMO_NEW_EXPERTS,
  DEMO_TRENDING_EXPERTS,
  DEMO_TRENDING_TOPICS,
} from "@/config/demo-content";
import { ROUTES } from "@/config/constants";
import { hubProfileHref } from "@/lib/hub-links";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Browse experts, topics, and Knowledge Twins across the Smitvi network.",
};

export default async function DiscoverPage() {
  const [liveTrending, liveNew, liveTopics] = await Promise.all([
    container.search.trendingExperts(),
    container.search.newExperts(),
    container.search.trendingTopics(),
  ]);

  const usingDemoExperts = liveTrending.length === 0;
  const usingDemoNew = liveNew.length === 0;
  const usingDemoTopics = liveTopics.length === 0;

  const trendingExperts = usingDemoExperts
    ? DEMO_TRENDING_EXPERTS.map((e) => ({
        username: e.username,
        displayName: e.displayName,
        headline: e.headline,
        avatarUrl: null as string | null,
      }))
    : liveTrending;

  const newExperts = usingDemoNew
    ? DEMO_NEW_EXPERTS.map((e) => ({
        username: e.username,
        displayName: e.displayName,
        headline: e.headline,
        avatarUrl: null as string | null,
      }))
    : liveNew;

  const trendingTopics = usingDemoTopics ? DEMO_TRENDING_TOPICS : liveTopics;
  const maxTopicCount = Math.max(
    ...trendingTopics.map((t) => t.sourceCount),
    1,
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-20 px-4 py-12 sm:px-6 sm:py-16">
      {/* 1. Hero */}
      <PageHero
        eyebrow="Discover"
        title="Find expertise that answers back"
        description="Browse Knowledge Twins by domain, follow rising topics, and ask experts whose answers stay grounded in real sources."
        actions={
          <>
            <Button asChild>
              <Link href={ROUTES.search}>
                <Search className="h-4 w-4" />
                Search the network
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={ROUTES.signup}>Create your Twin</Link>
            </Button>
          </>
        }
      />

      {usingDemoExperts || usingDemoNew || usingDemoTopics ? (
        <p className="-mt-10 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/50 px-4 py-3 text-sm text-[var(--muted-foreground)]">
          Showing example network highlights until live public Twins are
          published.{" "}
          <Link
            href={ROUTES.signup}
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            Be the first real expert →
          </Link>
        </p>
      ) : null}

      {/* 2. How Discover works — numbered guide strip */}
      <section aria-labelledby="discover-guide">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
              Start here
            </p>
            <h2
              id="discover-guide"
              className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Three ways to use Discover
            </h2>
          </div>
        </div>
        <ol className="mt-8 grid gap-8 border-t border-[var(--border)] pt-8 md:grid-cols-3">
          {DEMO_DISCOVER_GUIDES.map((guide, index) => (
            <li key={guide.title}>
              <p className="font-display text-3xl font-extrabold text-[var(--accent)]/25">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">
                <Link href={guide.href} className="hover:text-[var(--accent)]">
                  {guide.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {guide.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 3. Browse by domain — tile rows, not expert cards */}
      <section aria-labelledby="discover-domains">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
            Browse by domain
          </p>
          <h2
            id="discover-domains"
            className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            What kind of expertise do you need?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            Pick a domain to jump into search with a focused query. Each lane
            points to Twins trained on that kind of knowledge.
          </p>
        </div>
        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_DISCOVER_DOMAINS.map((domain) => (
            <Link
              key={domain.key}
              href={`/search?q=${encodeURIComponent(domain.query)}`}
              className="group bg-[var(--background)] p-6 transition-colors hover:bg-[var(--accent-soft)]/40"
            >
              <h3 className="font-display text-lg font-semibold tracking-tight group-hover:text-[var(--accent)]">
                {domain.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {domain.description}
              </p>
              <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                Explore
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Trending experts — ranked list pattern */}
      <section aria-labelledby="discover-trending">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-semibold tracking-[0.16em] uppercase">
                Trending now
              </p>
            </div>
            <h2
              id="discover-trending"
              className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Experts people are asking
            </h2>
            <p className="mt-3 max-w-xl text-sm text-[var(--muted-foreground)]">
              High-signal Twins rising across the network — open a profile or
              start chat when live.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href={ROUTES.search}>View all in search</Link>
          </Button>
        </div>

        <ol className="mt-8 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {trendingExperts.map((expert, index) => {
            const href = hubProfileHref(expert.username, !usingDemoExperts);
            return (
              <li key={expert.username}>
                <Link
                  href={href}
                  className="group flex items-center gap-4 py-5 transition-colors hover:bg-[var(--surface)]/50 sm:gap-6"
                >
                  <span className="w-8 shrink-0 font-display text-lg font-bold text-[var(--accent)]/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Avatar
                    src={expert.avatarUrl}
                    name={expert.displayName}
                    className="h-12 w-12"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold group-hover:text-[var(--accent)]">
                        {expert.displayName}
                      </p>
                      {usingDemoExperts ? (
                        <span className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                          Example
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-[var(--muted-foreground)]">
                      @{expert.username}
                      {expert.headline ? ` · ${expert.headline}` : ""}
                    </p>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-[var(--accent)] sm:inline-flex">
                    {usingDemoExperts ? "View example" : "View Twin"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 5. Topics — intensity bars (different from chips) */}
      <section
        aria-labelledby="discover-topics"
        className="rounded-[1.75rem] bg-[#0f172a] px-6 py-10 text-white sm:px-10 sm:py-12"
      >
        <div className="flex items-center gap-2 text-teal-300">
          <Tags className="h-4 w-4" />
          <p className="text-sm font-semibold tracking-[0.16em] uppercase">
            Rising topics
          </p>
        </div>
        <h2
          id="discover-topics"
          className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          What the network is talking about
        </h2>
        <p className="mt-3 max-w-xl text-sm text-white/60">
          Topics ranked by source activity. Click any topic to search experts
          and knowledge related to it.
        </p>

        <ul className="mt-8 space-y-4">
          {trendingTopics.map((topic) => {
            const width = Math.max(
              18,
              Math.round((topic.sourceCount / maxTopicCount) * 100),
            );
            return (
              <li key={topic.topic}>
                <Link
                  href={`/search?q=${encodeURIComponent(topic.topic)}`}
                  className="group block"
                >
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium group-hover:text-teal-300">
                      {topic.topic}
                    </span>
                    <span className="text-xs text-white/45">
                      {topic.sourceCount} sources
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-teal-400/80 transition-all group-hover:bg-teal-300"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 6. New experts — vertical timeline */}
      <section aria-labelledby="discover-new">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <UserPlus className="h-4 w-4" />
              <p className="text-sm font-semibold tracking-[0.16em] uppercase">
                Just arrived
              </p>
            </div>
            <h2
              id="discover-new"
              className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              New Knowledge Twins
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              Fresh experts who recently published a Twin. Meet them early —
              before they trend.
            </p>
            <Button asChild className="mt-6" variant="secondary">
              <Link href={ROUTES.signup}>
                Publish your Twin
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <ol className="relative space-y-0 border-l border-[var(--accent)]/30 pl-8">
            {newExperts.map((expert) => {
              const href = hubProfileHref(expert.username, !usingDemoNew);
              return (
                <li key={expert.username} className="relative pb-10 last:pb-0">
                  <span
                    aria-hidden
                    className="absolute top-1.5 -left-[2.05rem] h-3.5 w-3.5 rounded-full border-2 border-[var(--accent)] bg-[var(--background)]"
                  />
                  <Link href={href} className="group block">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={expert.avatarUrl}
                        name={expert.displayName}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold group-hover:text-[var(--accent)]">
                            {expert.displayName}
                          </p>
                          {usingDemoNew ? (
                            <span className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                              Example
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-[var(--muted)]">
                          @{expert.username}
                        </p>
                      </div>
                    </div>
                    {"headline" in expert && expert.headline ? (
                      <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                        {expert.headline}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 7. Closing CTA — accent panel */}
      <section className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)]/50 px-6 py-12 sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Compass className="h-4 w-4" />
              <p className="text-sm font-semibold tracking-[0.16em] uppercase">
                Keep exploring
              </p>
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Search by name, skill, or question
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted-foreground)]">
              Discover helps you browse. Search finds the exact Twin. Marketplace
              is where you hire or buy knowledge packs.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button asChild size="lg">
              <Link href={ROUTES.search}>
                <Search className="h-4 w-4" />
                Open search
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={ROUTES.marketplace}>
                <MessageSquareQuote className="h-4 w-4" />
                Browse marketplace
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
