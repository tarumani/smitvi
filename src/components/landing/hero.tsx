import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiNetworkCanvas } from "@/components/landing/ai-network-canvas";
import { HomeSearch } from "@/components/landing/home-search";
import { TwinChatDemo } from "@/components/landing/twin-chat-demo";
import { APP_OUTCOME, APP_TAGLINE, ROUTES, TRAIN_TWIN_LABEL } from "@/config/constants";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--background)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-100 [background-image:var(--hero-glow)]"
      />
      <div className="relative z-10 mx-auto grid h-[calc(100svh-4rem)] max-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-6 overflow-hidden px-4 py-5 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:py-6">
        <div className="max-w-xl">
          <p className="animate-fade-up inline-flex items-center gap-2 border-b border-[var(--accent)]/30 pb-1 text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            {APP_OUTCOME}
          </p>
          <h1 className="animate-fade-up-delay-1 mt-4 font-display text-[clamp(1.75rem,3.4vw,2.75rem)] font-bold leading-[1.12] tracking-tight">
            {APP_TAGLINE}
          </h1>
          <p className="animate-fade-up-delay-2 mt-3 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            {TRAIN_TWIN_LABEL} from your docs and notes, open a public profile
            people can chat with, and get paid through the marketplace and
            consultations — without repeating yourself.
          </p>

          <div className="animate-fade-up-delay-2 mt-5">
            <Button asChild size="lg" className="h-11 px-7">
              <Link href={ROUTES.signup}>
                Start earning from your knowledge
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <HomeSearch />

          <p className="animate-fade-up-delay-2 mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" />
            Earn from expertise · verified accounts · marketplace payouts
          </p>
        </div>

        <div
          id="demo"
          className="animate-fade-up-delay-2 relative hidden min-h-0 lg:block"
        >
          <div className="relative flex h-full min-h-[26rem] items-center justify-center">
            <AiNetworkCanvas className="opacity-55" />

            <div className="relative z-10 w-full max-w-[23.5rem]">
              <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                Live twin preview
              </p>
              <TwinChatDemo
                compact
                className="max-h-[min(22rem,calc(100svh-10rem))] opacity-95"
              />
              <div className="mt-3 flex justify-center gap-5 text-[11px] tracking-wide text-[var(--muted)]">
                <span>Train</span>
                <span aria-hidden>·</span>
                <span>Answer</span>
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
