import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmitviLogo } from "@/components/brand/smitvi-logo";
import { HomeSearch } from "@/components/landing/home-search";
import { TwinChatDemo } from "@/components/landing/twin-chat-demo";
import { APP_NAME, APP_TAGLINE, ROUTES } from "@/config/constants";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 hero-mesh" />
      <div className="absolute inset-y-0 right-0 hidden w-[55%] bg-gradient-to-l from-[#07111f] via-[#0b1728]/95 to-transparent lg:block dark:from-[#04070d]" />
      <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-[var(--accent)]/15 blur-3xl" />
      <div className="absolute bottom-0 right-[20%] h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto grid h-[calc(100svh-4rem)] max-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-6 overflow-hidden px-4 py-5 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-6">
        <div className="max-w-xl">
          <div className="animate-fade-up mb-2.5 flex items-center gap-3">
            <SmitviLogo
              href={null}
              showWordmark={false}
              markClassName="h-10 w-10 sm:h-11 sm:w-11"
            />
            <p className="font-display text-[clamp(2rem,5vw,3rem)] font-extrabold leading-none tracking-[-0.04em] text-[var(--foreground)]">
              {APP_NAME}
            </p>
          </div>
          <h1 className="animate-fade-up-delay-1 mt-3 font-display text-[clamp(1.35rem,2.4vw,2rem)] font-semibold leading-[1.15] tracking-tight">
            {APP_TAGLINE}
          </h1>
          <p className="animate-fade-up-delay-2 mt-3 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            Build an AI Knowledge Twin from your expertise — people learn, hire,
            and subscribe without you repeating yourself.
          </p>
          <div className="animate-fade-up-delay-2 mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6">
              <Link href={ROUTES.signup}>
                Create your Knowledge Twin
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6">
              <a href="#demo">See the Twin</a>
            </Button>
          </div>
          <HomeSearch />
        </div>

        <div
          id="demo"
          className="animate-fade-up-delay-2 relative hidden min-h-0 scroll-mt-24 lg:block lg:pl-2"
        >
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-teal-400/15 via-transparent to-sky-400/10 blur-2xl" />
          <TwinChatDemo compact className="max-h-[min(28rem,calc(100svh-7rem))]" />
        </div>
      </div>
    </section>
  );
}
