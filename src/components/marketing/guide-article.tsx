import Link from "next/link";
import type { GuidePost } from "@/content/guides";
import { ROUTES } from "@/config/constants";

export function GuideArticle({ guide }: { guide: GuidePost }) {
  return (
    <article className="mx-auto w-full max-w-3xl">
      <header className="mb-10">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
          Guides
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          {guide.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)]">
          {guide.description}
        </p>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Updated {guide.updatedAt} · {guide.readingMinutes} min read · Original
          Smitvi editorial
        </p>
      </header>

      <div className="space-y-10">
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--foreground)]">
              {section.heading}
            </h2>
            <div className="mt-3 space-y-4 text-base leading-relaxed text-[var(--muted-foreground)]">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
              {section.bullets?.length ? (
                <ul className="list-disc space-y-2 pl-5">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-14 border-t border-[var(--border)] pt-8 text-sm text-[var(--muted-foreground)]">
        <p>
          This guide is original Smitvi documentation — not scraped or syndicated
          third-party content.{" "}
          <Link href={ROUTES.guides} className="text-[var(--accent)] hover:underline">
            Browse all guides
          </Link>
          {" · "}
          <Link href={ROUTES.signup} className="text-[var(--accent)] hover:underline">
            Create your Intelligence Hub
          </Link>
        </p>
      </footer>
    </article>
  );
}
