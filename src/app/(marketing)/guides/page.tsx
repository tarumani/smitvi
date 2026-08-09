import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { MarketingPageAtmosphere } from "@/components/marketing/marketing-page-atmosphere";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { APP_NAME, ROUTES } from "@/config/constants";
import { listGuides } from "@/content/guides";

export const metadata: Metadata = {
  title: "Guides",
  description: `Original ${APP_NAME} guides on Knowledge Twins, Intelligence Hubs, grounded AI, and monetizing expertise.`,
};

export default function GuidesIndexPage() {
  const guides = listGuides();

  return (
    <div className="relative overflow-hidden">
      <MarketingPageAtmosphere />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <PageHero
          eyebrow="Editorial"
          title="Guides for experts and teams"
          description="Original, practical writing from the Smitvi team — how to train a Twin, publish a trustworthy hub, and monetize knowledge without burning out."
          actions={
            <>
              <Button asChild>
                <Link href={ROUTES.signup}>Start your hub</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={ROUTES.howItHelps}>How it helps</Link>
              </Button>
            </>
          }
        />

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
          These pages are first-party educational content. They are not scraped
          articles, affiliate dumps, or mirrored third-party posts. Hub profiles
          and Twin chat live on separate surfaces without ads.
        </p>

        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {guides.map((guide) => (
            <li key={guide.slug}>
              <GlassCard className="flex h-full flex-col p-6 transition-colors hover:border-[var(--accent)]/40">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--accent-soft)]">
                  <BookOpen className="h-5 w-5 text-[var(--accent)]" aria-hidden />
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {guide.updatedAt} · {guide.readingMinutes} min
                </p>
                <h2 className="mt-2 font-display text-lg font-bold tracking-tight text-[var(--foreground)]">
                  <Link
                    href={ROUTES.guide(guide.slug)}
                    className="hover:text-[var(--accent)]"
                  >
                    {guide.title}
                  </Link>
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {guide.description}
                </p>
                <Link
                  href={ROUTES.guide(guide.slug)}
                  className="mt-4 text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  Read guide →
                </Link>
              </GlassCard>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
