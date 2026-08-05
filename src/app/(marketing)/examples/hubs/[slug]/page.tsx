import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { getExampleHubBySlug } from "@/config/example-hubs";
import { ROUTES, TRAIN_TWIN_LABEL } from "@/config/constants";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const hub = getExampleHubBySlug(slug);
  if (!hub) return { title: "Example hub" };
  return {
    title: `${hub.displayName} — Example Intelligence Hub`,
    description: hub.headline,
  };
}

export default async function ExampleHubPage({ params }: PageProps) {
  const { slug } = await params;
  const hub = getExampleHubBySlug(slug);
  if (!hub) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/40 px-4 py-3 text-sm text-[var(--muted-foreground)]">
        <span className="font-semibold text-[var(--foreground)]">
          Featured example
        </span>{" "}
        — this is how a complete Intelligence Hub looks on Smitvi. Real @{hub.username}{" "}
        is not live yet; publish your own hub to appear in Discover.
      </p>

      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar name={hub.displayName} className="h-24 w-24 shrink-0" />
        <div>
          <PageHero
            eyebrow="Intelligence Hub"
            title={hub.displayName}
            description={hub.headline}
          />
          <p className="mt-4 text-sm text-[var(--muted)]">@{hub.username}</p>
        </div>
      </div>

      <p className="mt-8 text-base leading-relaxed text-[var(--muted-foreground)]">
        {hub.bio}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {hub.topics.map((topic) => (
          <Link
            key={topic}
            href={`${ROUTES.search}?q=${encodeURIComponent(topic)}`}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium hover:border-[var(--accent)]"
          >
            {topic}
          </Link>
        ))}
      </div>

      <section className="mt-14" id="knowledge">
        <h2 className="font-display text-2xl font-semibold">Published knowledge</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Sample sources that would power this Twin — with citations in chat.
        </p>
        <ul className="mt-6 space-y-4">
          {hub.knowledgeHighlights.map((item) => (
            <li key={item.title}>
              <GlassCard className="p-5">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {item.summary}
                </p>
              </GlassCard>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" id="twin-chat">
        <h2 className="font-display text-2xl font-semibold">Twin chat</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Visitors ask questions; answers stay grounded in uploaded sources.
        </p>
        <ul className="mt-6 space-y-3">
          {hub.sampleQuestions.map((q) => (
            <li
              key={q}
              className="rounded-xl border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-sm"
            >
              {q}
            </li>
          ))}
        </ul>
        <Button asChild className="mt-6">
          <Link href={ROUTES.signup}>
            Create your Twin to enable chat
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <section className="mt-14 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-8">
        <h2 className="font-display text-xl font-semibold">Build a hub like this</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Add a headline and bio, upload public knowledge, then open your hub on
          Discover when you are ready.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={ROUTES.signup}>Start free</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={ROUTES.productTrainTwin}>{TRAIN_TWIN_LABEL}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={ROUTES.discover}>Browse Discover</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
