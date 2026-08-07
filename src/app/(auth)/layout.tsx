import type { ReactNode } from "react";
import type { Metadata } from "next";
import { SmitviLogo } from "@/components/brand/smitvi-logo";
import { HeroVisual } from "@/components/landing/hero-visual";
import { MarketingVisual } from "@/components/marketing/marketing-illustrations";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { APP_TAGLINE } from "@/config/constants";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-[var(--background)]">
      <HeroVisual />
      <div className="relative z-10 mx-auto flex h-14 w-full max-w-6xl shrink-0 items-center justify-between px-4 sm:px-6">
        <SmitviLogo size="sm" />
        <ThemeToggle />
      </div>
      <div className="relative z-10 mx-auto grid min-h-0 w-full max-w-6xl flex-1 grid-cols-1 items-center gap-8 px-4 pb-6 lg:grid-cols-[1fr_min(340px,42%)] lg:gap-12 lg:pb-8">
        <div className="hidden flex-col justify-center lg:flex">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
            Human Intelligence OS
          </p>
          <h2 className="mt-3 max-w-md font-display text-3xl font-bold tracking-tight">
            {APP_TAGLINE}
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
            Train your AI Twin, launch your hub, and grow visits from one place.
          </p>
          <div className="mt-8 max-w-sm">
            <MarketingVisual id="twin" />
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">{children}</div>
      </div>
    </div>
  );
}
