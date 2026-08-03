import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Sparkles, Tags, UserRound } from "lucide-react";
import { container } from "@/application/container";
import { PageHero } from "@/components/layout/page-hero";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Discover",
  description: "Trending experts, topics, and new Knowledge Twins on Smitvi.",
};

export default async function DiscoverPage() {
  const [trendingExperts, newExperts, trendingTopics] = await Promise.all([
    container.search.trendingExperts(),
    container.search.newExperts(),
    container.search.trendingTopics(),
  ]);

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

      <section className="animate-fade-up-delay-1 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Trending experts
          </h2>
        </div>
        {trendingExperts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {trendingExperts.map((expert) => (
              <Link
                key={expert.username}
                href={ROUTES.publicProfile(expert.username)}
                className="group"
              >
                <GlassCard className="flex items-center gap-4 p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[var(--surface-elevated)]">
                  <Avatar src={expert.avatarUrl} name={expert.displayName} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {expert.displayName}
                    </p>
                    <p className="truncate text-sm text-[var(--muted-foreground)]">
                      @{expert.username}
                      {expert.headline ? ` · ${expert.headline}` : ""}
                    </p>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<UserRound className="h-8 w-8 text-[var(--accent)]" />}
            title="No experts yet"
            description="Be among the first to publish a public Knowledge Twin and appear here."
            action={
              <Button asChild size="sm">
                <Link href={ROUTES.signup}>Get started</Link>
              </Button>
            }
          />
        )}
      </section>

      <section className="animate-fade-up-delay-2 space-y-5">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            New experts
          </h2>
        </div>
        {newExperts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {newExperts.map((expert) => (
              <Link
                key={expert.username}
                href={ROUTES.publicProfile(expert.username)}
                className="group"
              >
                <GlassCard className="h-full p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[var(--surface-elevated)]">
                  <div className="flex items-center gap-3">
                    <Avatar src={expert.avatarUrl} name={expert.displayName} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {expert.displayName}
                      </p>
                      <p className="truncate text-sm text-[var(--muted-foreground)]">
                        @{expert.username}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Compass className="h-8 w-8 text-[var(--accent)]" />}
            title="Waiting for pioneers"
            description="New public profiles will show up here as experts join Smitvi."
          />
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Tags className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Trending topics
          </h2>
        </div>
        {trendingTopics.length > 0 ? (
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
        ) : (
          <EmptyState
            icon={<Tags className="h-8 w-8 text-[var(--accent)]" />}
            title="Topics coming soon"
            description="Topics appear when experts publish public knowledge to the network."
            action={
              <Button asChild size="sm" variant="secondary">
                <Link href={ROUTES.knowledge}>Upload knowledge</Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
