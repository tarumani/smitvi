import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Sparkles, Tags } from "lucide-react";
import { container } from "@/application/container";
import { PageHero } from "@/components/layout/page-hero";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  DEMO_NEW_EXPERTS,
  DEMO_TRENDING_EXPERTS,
  DEMO_TRENDING_TOPICS,
} from "@/config/demo-content";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Discover",
  description: "Trending experts, topics, and new Knowledge Twins on Smitvi.",
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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-14 px-4 py-12 sm:px-6 sm:py-16">
      <PageHero
        eyebrow="Explore"
        title="Discover"
        description="Trending experts, fresh Knowledge Twins, and topics rising across the Smitvi network."
        actions={
          <>
            <Button asChild>
              <Link href={ROUTES.search}>Search the network</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={ROUTES.signup}>Create your Twin</Link>
            </Button>
          </>
        }
      />

      {usingDemoExperts || usingDemoTopics ? (
        <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-3 text-sm text-[var(--muted-foreground)]">
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

      <section className="animate-fade-up-delay-1 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Trending experts
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {trendingExperts.map((expert) => {
            const href = usingDemoExperts
              ? ROUTES.signup
              : ROUTES.publicProfile(expert.username);
            return (
              <Link key={expert.username} href={href} className="group">
                <GlassCard className="flex items-center gap-4 p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[var(--surface-elevated)]">
                  <Avatar src={expert.avatarUrl} name={expert.displayName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">
                        {expert.displayName}
                      </p>
                      {usingDemoExperts ? (
                        <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--accent)] uppercase">
                          Example
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-[var(--muted-foreground)]">
                      @{expert.username}
                      {expert.headline ? ` · ${expert.headline}` : ""}
                    </p>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="animate-fade-up-delay-2 space-y-5">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            New experts
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {newExperts.map((expert) => {
            const href = usingDemoNew
              ? ROUTES.signup
              : ROUTES.publicProfile(expert.username);
            return (
              <Link key={expert.username} href={href} className="group">
                <GlassCard className="h-full p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[var(--surface-elevated)]">
                  <div className="flex items-center gap-3">
                    <Avatar src={expert.avatarUrl} name={expert.displayName} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">
                          {expert.displayName}
                        </p>
                        {usingDemoNew ? (
                          <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--accent)] uppercase">
                            Example
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-[var(--muted-foreground)]">
                        @{expert.username}
                      </p>
                    </div>
                  </div>
                  {"headline" in expert && expert.headline ? (
                    <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                      {expert.headline}
                    </p>
                  ) : null}
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Tags className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Trending topics
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {trendingTopics.map((topic) => (
            <Link
              key={topic.topic}
              href={`/search?q=${encodeURIComponent(topic.topic)}`}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
            >
              {topic.topic}
              <span className="ml-2 text-[var(--muted)]">
                {topic.sourceCount}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
