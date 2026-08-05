import type { ReactNode } from "react";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

type InfoPageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export function InfoPageShell({
  eyebrow,
  title,
  description,
  children,
  primaryCta,
  secondaryCta,
}: InfoPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <PageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          primaryCta || secondaryCta ? (
            <>
              {primaryCta ? (
                <Button asChild>
                  <Link href={primaryCta.href}>{primaryCta.label}</Link>
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button asChild variant="secondary">
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </>
          ) : undefined
        }
      />
      <div className="prose prose-neutral mt-12 max-w-none dark:prose-invert prose-headings:font-display prose-headings:tracking-tight prose-p:text-[var(--muted-foreground)] prose-li:text-[var(--muted-foreground)]">
        {children}
      </div>
      <p className="mt-12 text-sm text-[var(--muted)]">
        <Link href={ROUTES.home} className="text-[var(--accent)] hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
