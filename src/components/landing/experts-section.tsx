import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

export function ExpertsSection() {
  return (
    <section id="experts" className="relative overflow-hidden">
      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-[var(--accent)] px-6 py-14 text-[var(--accent-foreground)] sm:px-12 lg:px-16 lg:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-white/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 left-20 h-48 w-48 rounded-full bg-sky-300/20"
          />

          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-white/70 uppercase">
              For experts
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.05]">
              Built for people whose knowledge is the product
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/80 sm:text-lg">
              Designers, developers, doctors, lawyers, teachers, researchers,
              coaches, and creators — Smitvi is where human expertise becomes
              searchable and scalable.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="bg-white text-[var(--accent)] hover:bg-white/90"
              >
                <Link href={ROUTES.signup}>
                  Start building your Twin
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
