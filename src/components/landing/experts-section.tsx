import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

export function ExpertsSection() {
  return (
    <section id="experts" className="relative overflow-hidden">
      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
        <div className="relative overflow-hidden border-y border-[var(--border)] py-16 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_80%_50%,rgba(15,118,110,0.08),transparent_65%)]"
          />
          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
              For experts
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.05]">
              Built for people whose knowledge is the product
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
              Designers, developers, doctors, lawyers, teachers, researchers,
              coaches, and creators — Smitvi is where human expertise becomes
              searchable and scalable.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
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
