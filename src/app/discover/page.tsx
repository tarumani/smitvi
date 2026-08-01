import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/application/container";
import { Avatar } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Discover",
};

export default async function DiscoverPage() {
  const [trendingExperts, newExperts, trendingTopics] = await Promise.all([
    container.search.trendingExperts(),
    container.search.newExperts(),
    container.search.trendingTopics(),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Discover
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Trending experts, topics, and new Knowledge Twins on Smitvi.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Trending experts</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {trendingExperts.map((expert) => (
            <Link key={expert.username} href={ROUTES.publicProfile(expert.username)}>
              <GlassCard className="flex items-center gap-3 p-4 transition-colors hover:bg-[var(--surface-elevated)]">
                <Avatar src={expert.avatarUrl} name={expert.displayName} />
                <div>
                  <p className="font-semibold">{expert.displayName}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    @{expert.username}
                    {expert.headline ? ` · ${expert.headline}` : ""}
                  </p>
                </div>
              </GlassCard>
            </Link>
          ))}
          {trendingExperts.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No experts yet.</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">New experts</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {newExperts.map((expert) => (
            <Link key={expert.username} href={ROUTES.publicProfile(expert.username)}>
              <GlassCard className="p-4 transition-colors hover:bg-[var(--surface-elevated)]">
                <p className="font-semibold">{expert.displayName}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  @{expert.username}
                </p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Trending topics</h2>
        <div className="flex flex-wrap gap-2">
          {trendingTopics.map((topic) => (
            <Link
              key={topic.topic}
              href={`/search?q=${encodeURIComponent(topic.topic)}`}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            >
              {topic.topic} · {topic.sourceCount}
            </Link>
          ))}
          {trendingTopics.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Topics appear when public knowledge is published.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
