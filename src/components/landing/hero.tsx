import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiNetworkCanvas } from "@/components/landing/ai-network-canvas";
import { HomeSearch } from "@/components/landing/home-search";
import { TwinChatDemo } from "@/components/landing/twin-chat-demo";
import {
  APP_OUTCOME,
  APP_TAGLINE,
  ROUTES,
} from "@/config/constants";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--background)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-100 [background-image:var(--hero-glow)]"
      />
      <div className="relative z-10 mx-auto grid h-[calc(100svh-4rem)] max-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-6 overflow-hidden px-4 py-5 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:py-6">
        <div className="max-w-lg">
          <p className="animate-fade-up inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
            <Sparkles className="h-3 w-3" />
            Human Intelligence OS
          </p>
          <h1 className="animate-fade-up-delay-1 mt-3 font-display text-[clamp(1.5rem,2.6vw,2.15rem)] font-bold leading-tight tracking-tight">
            {APP_TAGLINE}
          </h1>
          <p className="animate-fade-up-delay-2 mt-2.5 max-w-sm text-sm leading-snug text-[var(--muted-foreground)]">
            {APP_OUTCOME} Train your AI Twin and launch your Intelligence Hub.
          </p>

          <div className="animate-fade-up-delay-2 mt-4">
            <Button asChild size="default" className="h-10 px-5">
              <Link href={ROUTES.signup}>
                Start your Intelligence Hub
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <HomeSearch />
        </div>

        <div
          id="demo"
          className="animate-fade-up-delay-2 relative hidden min-h-0 lg:block"
        >
          <div className="relative flex h-full min-h-[26rem] items-center justify-center">
            <AiNetworkCanvas className="opacity-55" />

            <div className="relative z-10 w-full max-w-[23.5rem]">
              <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                Live Intelligence Hub preview
              </p>
              <TwinChatDemo
                compact
                className="max-h-[min(22rem,calc(100svh-10rem))] opacity-95"
              />
              <div className="mt-3 flex justify-center gap-5 text-[11px] tracking-wide text-[var(--muted)]">
                <span>Train</span>
                <span aria-hidden>·</span>
                <span>Influence</span>
                <span aria-hidden>·</span>
                <span>Earn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
