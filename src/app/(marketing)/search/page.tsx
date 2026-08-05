import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search as SearchIcon } from "lucide-react";
import { container } from "@/application/container";
import { PageHero } from "@/components/layout/page-hero";
import { Avatar } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Search",
  description: "Search people, skills, topics, and knowledge across Smitvi.",
};

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results =
    query.length >= 2
      ? await container.search.search(query)
      : {
          people: [],
          skills: [],
          topics: [],
          knowledge: [],
          questions: [],
        };

  const hasResults =
    results.people.length +
      results.skills.length +
      results.topics.length +
      results.knowledge.length +
      results.questions.length >
    0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <PageHero
        eyebrow="Search"
        title="Find human intelligence"
        description="People, skills, topics, knowledge, and questions across the Smitvi network."
      />

      <form className="animate-fade-up-delay-1 mt-8 w-full" action="/search">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search experts, skills, topics…"
            className="h-12 border-[var(--glass-border)] bg-[var(--glass)] pr-[6.75rem] pl-11 shadow-[var(--glass-shadow)] backdrop-blur-xl"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute top-1/2 right-1.5 h-9 -translate-y-1/2 px-4"
          >
            Search
          </Button>
        </div>
      </form>

      {query.length > 0 && query.length < 2 ? (
        <p className="mt-8 text-sm text-[var(--muted)]">
          Type at least 2 characters.
        </p>
      ) : null}

      {query.length >= 2 && !hasResults ? (
        <div className="mt-10">
          <EmptyState
            icon={<SearchIcon className="h-8 w-8 text-[var(--accent)]" />}
            title={`No results for “${query}”`}
            description="Try another name, skill, or topic — or explore trending experts on Discover."
            action={
              <Button asChild variant="secondary" size="sm">
                <Link href={ROUTES.discover}>Browse Discover</Link>
              </Button>
            }
          />
        </div>
      ) : null}

      {!query ? (
        <div className="mt-10">
          <EmptyState
            icon={<SearchIcon className="h-8 w-8 text-[var(--accent)]" />}
            title="Start searching"
            description="Look up experts by name, scan skills and topics, or find public knowledge packs."
            action={
              <Button asChild variant="secondary" size="sm">
                <Link href={ROUTES.discover}>Explore Discover</Link>
              </Button>
            }
          />
        </div>
      ) : null}

      <div className="mt-12 space-y-12">
        {results.people.length ? (
          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold">People</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(16.5rem,1fr))] gap-3">
              {results.people.map((person) => (
                <Link
                  key={person.username}
                  href={ROUTES.publicProfile(person.username)}
                  className="group"
                >
                  <GlassCard className="flex h-full items-start gap-3 p-4 transition-colors group-hover:bg-[var(--surface-elevated)]">
                    <Avatar
                      src={person.avatarUrl}
                      name={person.displayName}
                      className="h-11 w-11"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold group-hover:text-[var(--accent)]">
                        {person.displayName}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-[var(--muted-foreground)]">
                        @{person.username}
                      </p>
                      {person.headline ? (
                        <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                          {person.headline}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {person.ratingAverage > 0
                          ? `${person.ratingAverage.toFixed(1)}★`
                          : "New"}
                        {" · "}
                        {person.followersCount} followers
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
                  </GlassCard>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {results.knowledge.length ? (
          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Knowledge</h2>
            {results.knowledge.map((item) => (
              <Link
                key={item.id}
                href={ROUTES.publicProfile(item.ownerUsername)}
              >
                <GlassCard className="mb-3 p-5 transition-colors hover:bg-[var(--surface-elevated)]">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    by @{item.ownerUsername}
                  </p>
                  {item.summary ? (
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      {item.summary}
                    </p>
                  ) : null}
                </GlassCard>
              </Link>
            ))}
          </section>
        ) : null}

        {results.skills.length ? (
          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {results.skills.map((skill) => (
                <Link
                  key={skill.slug}
                  href={`/search?q=${encodeURIComponent(skill.name)}`}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                >
                  {skill.name} · {skill.profileCount}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {results.topics.length ? (
          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Topics</h2>
            <div className="flex flex-wrap gap-2">
              {results.topics.map((topic) => (
                <Link
                  key={topic.topic}
                  href={`/search?q=${encodeURIComponent(topic.topic)}`}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                >
                  {topic.topic} · {topic.sourceCount}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {results.questions.length ? (
          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Questions</h2>
            {results.questions.map((item) => (
              <Link
                key={`${item.ownerUsername}-${item.question}`}
                href={ROUTES.publicTwinChat(item.ownerUsername)}
              >
                <GlassCard className="mb-3 p-5 transition-colors hover:bg-[var(--surface-elevated)]">
                  <p className="font-medium">{item.question}</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    @{item.ownerUsername} · {item.sourceTitle}
                  </p>
                </GlassCard>
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}
