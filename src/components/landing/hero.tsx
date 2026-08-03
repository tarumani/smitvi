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
      <div className="absolute inset-y-0 right-0 hidden w-[58%] bg-gradient-to-l from-[#07111f] via-[#0b1728]/95 to-transparent lg:block dark:from-[#04070d]" />
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[var(--accent)]/20 blur-3xl" />
      <div className="absolute bottom-0 right-[20%] h-80 w-80 rounded-full bg-sky-400/15 blur-3xl" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-14">
        <div className="max-w-xl">
          <div className="animate-fade-up mb-4">
            <SmitviLogo
              href={null}
              showWordmark={false}
              markClassName="h-14 w-14 sm:h-16 sm:w-16"
            />
          </div>
          <p className="animate-fade-up font-display text-[clamp(3.25rem,10vw,6.75rem)] font-extrabold leading-[0.88] tracking-[-0.05em] text-[var(--foreground)]">
            {APP_NAME}
          </p>
          <h1 className="animate-fade-up-delay-1 mt-5 font-display text-[clamp(1.5rem,2.8vw,2.4rem)] font-semibold leading-[1.12] tracking-tight">
            {APP_TAGLINE}
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 max-w-md text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
            Build an AI Knowledge Twin from your expertise — people learn, hire,
            and subscribe without you repeating yourself.
          </p>
          <div className="animate-fade-up-delay-2 mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-7 text-base">
              <Link href={ROUTES.signup}>
                Create your Knowledge Twin
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
              <a href="#demo">See the Twin</a>
            </Button>
          </div>
          <HomeSearch />
        </div>

        <div id="demo" className="animate-fade-up-delay-2 relative scroll-mt-24 lg:pl-4">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-teal-400/20 via-transparent to-sky-400/10 blur-2xl" />
          <TwinChatDemo className="animate-float-soft" />
        </div>
      </div>
    </section>
  );
}
