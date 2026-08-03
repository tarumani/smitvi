import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeSearch } from "@/components/landing/home-search";
import { TwinChatDemo } from "@/components/landing/twin-chat-demo";
import { APP_NAME, APP_TAGLINE, ROUTES } from "@/config/constants";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute -left-24 top-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(15,118,110,0.28),transparent_68%)]"
      />
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute right-[-10%] top-10 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.18),transparent_70%)] [animation-delay:2s]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] bg-gradient-to-l from-[#07111f] via-[#0b1728]/88 to-transparent lg:block dark:from-[#04070d]"
      />

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-8 overflow-hidden px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-10">
        <div className="max-w-xl">
          <p className="animate-fade-up font-display text-[clamp(2.6rem,6vw,4.25rem)] font-extrabold leading-none tracking-[-0.04em] text-[var(--foreground)]">
            {APP_NAME}
          </p>
          <h1 className="animate-fade-up-delay-1 mt-3 font-display text-[clamp(1.45rem,2.8vw,2.15rem)] font-semibold leading-[1.2] tracking-tight text-[var(--foreground)]">
            {APP_TAGLINE}
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 max-w-md text-base leading-relaxed text-[var(--muted-foreground)]">
            Turn expertise into an AI twin that answers with citations, opens
            public chat, and helps you monetize knowledge without repeating
            yourself.
          </p>

          <div className="animate-fade-up-delay-2 mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 px-7">
              <Link href={ROUTES.signup}>
                Create your Knowledge Twin
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-12 px-6">
              <Link href={ROUTES.discover}>Explore experts</Link>
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
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-[2.25rem] bg-gradient-to-br from-teal-400/20 via-transparent to-sky-400/14 blur-2xl"
          />
          <div className="animate-float-soft">
            <TwinChatDemo
              compact
              className="max-h-[min(28rem,calc(100svh-8rem))]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
