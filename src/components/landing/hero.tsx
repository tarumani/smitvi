import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeSearch } from "@/components/landing/home-search";
import { TwinChatDemo } from "@/components/landing/twin-chat-demo";
import { APP_TAGLINE, ROUTES } from "@/config/constants";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-y-0 right-0 hidden w-[52%] bg-gradient-to-l from-[#07111f] via-[#0b1728]/90 to-transparent lg:block dark:from-[#04070d]" />
      <div className="absolute -left-20 top-8 h-64 w-64 rounded-full bg-[var(--accent)]/18 blur-3xl" />
      <div className="absolute right-[18%] bottom-0 h-72 w-72 rounded-full bg-sky-400/12 blur-3xl" />

      <div className="relative z-10 mx-auto grid h-[calc(100svh-4rem)] max-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-6 overflow-hidden px-4 py-5 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:py-6">
        <div className="max-w-xl">
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase backdrop-blur-md">
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
          className="animate-fade-up-delay-2 relative hidden min-h-0 lg:block lg:pl-2"
        >
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-teal-400/18 via-transparent to-sky-400/12 blur-2xl" />
          <TwinChatDemo
            compact
            className="max-h-[min(26rem,calc(100svh-7.5rem))]"
          />
        </div>
      </div>
    </section>
  );
}
