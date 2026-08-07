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
      <div className="relative z-10 mx-auto flex h-14 w-full max-w-5xl shrink-0 items-center justify-between px-4 sm:px-6">
        <SmitviLogo size="sm" />
        <ThemeToggle />
      </div>
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col items-center justify-center gap-8 px-4 pb-6 sm:gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:pb-8">
        <div className="hidden w-full max-w-sm flex-col justify-center lg:flex lg:w-[min(100%,22rem)] lg:shrink-0">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
            Human Intelligence OS
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight xl:text-3xl">
            {APP_TAGLINE}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            Train your AI Twin, launch your hub, and grow visits from one place.
          </p>
          <div className="mt-6 scale-[0.92] origin-top-left xl:scale-100">
            <MarketingVisual id="twin" />
          </div>
        </div>
        <div className="flex w-full max-w-md shrink-0 justify-center lg:w-[min(100%,26rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}
