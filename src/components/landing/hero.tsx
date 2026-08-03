import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiNetworkCanvas } from "@/components/landing/ai-network-canvas";
import { HomeSearch } from "@/components/landing/home-search";
import { TwinChatDemo } from "@/components/landing/twin-chat-demo";
import { APP_TAGLINE, ROUTES } from "@/config/constants";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="relative z-10 mx-auto grid h-[calc(100svh-4rem)] max-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-6 overflow-hidden px-4 py-5 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-6">
        <div className="max-w-xl">
          <p className="animate-fade-up inline-flex items-center gap-2 border-b border-[var(--accent)]/30 pb-1 text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Knowledge Twin platform
          </p>
          <h1 className="animate-fade-up-delay-1 mt-4 font-display text-[clamp(1.75rem,3.4vw,2.75rem)] font-bold leading-[1.12] tracking-tight">
            {APP_TAGLINE}
          </h1>
          <p className="animate-fade-up-delay-2 mt-3 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            Turn your expertise into an AI twin that answers with citations,
            opens public chat, and helps you monetize knowledge without
            repeating yourself.
          </p>

          <div className="animate-fade-up-delay-2 mt-5">
            <Button asChild size="lg" className="h-11 px-7">
              <Link href={ROUTES.signup}>
                Create your Knowledge Twin
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <HomeSearch />

          <p className="animate-fade-up-delay-2 mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" />
            Grounded answers · email-verified accounts · marketplace ready
          </p>
        </div>

        <div
          id="demo"
          className="animate-fade-up-delay-2 relative hidden min-h-0 lg:block"
        >
          <div className="relative flex h-full min-h-[26rem] items-center justify-center">
            <AiNetworkCanvas className="opacity-80" />

            <div className="relative z-10 w-full max-w-[26rem] animate-float-soft">
              <div className="mb-3 flex items-center justify-between px-1 text-[11px] font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
                <span>Live twin preview</span>
                <span className="text-[var(--muted)]">Grounded · Cited</span>
              </div>
              <TwinChatDemo
                compact
                className="max-h-[min(24rem,calc(100svh-9rem))]"
              />
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-[var(--muted-foreground)]">
                <div className="border-t border-[var(--accent)]/35 pt-2">
                  Sources
                </div>
                <div className="border-t border-[var(--accent)]/35 pt-2">
                  Retrieval
                </div>
                <div className="border-t border-[var(--accent)]/35 pt-2">
                  Citations
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
