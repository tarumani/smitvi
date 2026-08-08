import type { ReactNode } from "react";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";
import { MarketingPageAtmosphere } from "@/components/marketing/marketing-page-atmosphere";
import {
  MarketingVisual,
  type MarketingVisualId,
} from "@/components/marketing/marketing-illustrations";

type InfoPageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  visual?: MarketingVisualId;
};

export function InfoPageShell({
  eyebrow,
  title,
  description,
  children,
  primaryCta,
  secondaryCta,
  visual = "about",
}: InfoPageShellProps) {
  return (
    <div className="relative overflow-hidden">
      <MarketingPageAtmosphere />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_min(360px,38%)] lg:items-start lg:gap-12">
          <div className="min-w-0">
            {visual ? (
              <div className="mb-8 lg:hidden">
                <MarketingVisual id={visual} compact />
              </div>
            ) : null}
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
            <div className="mt-10 space-y-5 sm:mt-12">{children}</div>
            <p className="mt-12 text-sm text-[var(--muted)]">
              <Link href={ROUTES.home} className="text-[var(--accent)] hover:underline">
                ← Back to home
              </Link>
            </p>
          </div>

          {visual ? (
            <aside className="hidden lg:block lg:sticky lg:top-24">
              <MarketingVisual id={visual} />
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
