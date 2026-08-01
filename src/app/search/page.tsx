import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/application/container";
import { Avatar } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Search",
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
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Search</h1>
      <p className="mt-2 text-[var(--muted-foreground)]">
        People, skills, topics, knowledge, and questions across Smitvi.
      </p>

      <form className="mt-6 flex gap-2" action="/search">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search experts, skills, topics…"
          className="h-12"
        />
        <Button type="submit" className="h-12 px-6">
          Search
        </Button>
      </form>

      {query.length > 0 && query.length < 2 ? (
        <p className="mt-8 text-sm text-[var(--muted)]">
          Type at least 2 characters.
        </p>
      ) : null}

      {query.length >= 2 && !hasResults ? (
        <GlassCard className="mt-8 p-6 text-sm text-[var(--muted-foreground)]">
          No results for “{query}”.
        </GlassCard>
      ) : null}

      <div className="mt-10 space-y-10">
        {results.people.length ? (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">People</h2>
            <div className="grid gap-3">
              {results.people.map((person) => (
                <Link key={person.username} href={ROUTES.publicProfile(person.username)}>
                  <GlassCard className="flex items-center gap-3 p-4 transition-colors hover:bg-[var(--surface-elevated)]">
                    <Avatar src={person.avatarUrl} name={person.displayName} />
                    <div>
                      <p className="font-semibold">{person.displayName}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        @{person.username}
                        {person.headline ? ` · ${person.headline}` : ""}
                      </p>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {results.knowledge.length ? (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Knowledge</h2>
            {results.knowledge.map((item) => (
              <Link
                key={item.id}
                href={ROUTES.publicProfile(item.ownerUsername)}
              >
                <GlassCard className="mb-3 p-4">
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
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {results.skills.map((skill) => (
                <Link
                  key={skill.slug}
                  href={`/search?q=${encodeURIComponent(skill.name)}`}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
                >
                  {skill.name} · {skill.profileCount}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {results.topics.length ? (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Topics</h2>
            <div className="flex flex-wrap gap-2">
              {results.topics.map((topic) => (
                <Link
                  key={topic.topic}
                  href={`/search?q=${encodeURIComponent(topic.topic)}`}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
                >
                  {topic.topic} · {topic.sourceCount}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {results.questions.length ? (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Questions</h2>
            {results.questions.map((item) => (
              <Link
                key={`${item.ownerUsername}-${item.question}`}
                href={ROUTES.publicTwinChat(item.ownerUsername)}
              >
                <GlassCard className="mb-3 p-4">
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
