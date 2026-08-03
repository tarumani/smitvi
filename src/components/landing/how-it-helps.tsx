import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  GraduationCap,
  Users,
  FileText,
  BrainCircuit,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

const flow = [
  {
    icon: FileText,
    title: "Upload",
    body: "Documents, notes, decks, and FAQs — the artifacts of your real expertise.",
  },
  {
    icon: BrainCircuit,
    title: "Index",
    body: "Chunk, embed, and structure knowledge into a private intelligence graph.",
  },
  {
    icon: Rocket,
    title: "Launch",
    body: "Open Twin chat, get discovered, and monetize when you’re ready.",
  },
] as const;

const audiences = [
  {
    icon: Briefcase,
    title: "Experts & creators",
    body: "Stop repeating answers. Publish a Twin that cites your sources and earns while you focus.",
  },
  {
    icon: GraduationCap,
    title: "Learners & teams",
    body: "Ask anytime for grounded answers. Discover by skill — hire a human when it matters.",
  },
  {
    icon: Users,
    title: "Organizations",
    body: "Shared workspace Twins keep institutional memory searchable and onboarding fast.",
  },
] as const;

type HowItHelpsProps = {
  showIntro?: boolean;
  showPageLink?: boolean;
};

export function HowItHelps({
  showIntro = true,
  showPageLink = true,
}: HowItHelpsProps) {
  return (
    <section id="how-it-helps" className="relative overflow-hidden">
      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        {showIntro ? (
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
              How it helps
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.05]">
              Scale your mind. Find expertise that answers back.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--muted-foreground)]">
              Smitvi turns human expertise into a searchable Knowledge Twin —
              useful for the people who teach, and for the people who need
              answers.
            </p>
          </div>
        ) : null}

        {/* Intelligence pipeline — not cards */}
        <div className="relative mt-14">
          <div
            aria-hidden
            className="absolute top-[2.15rem] right-0 left-0 hidden h-px bg-gradient-to-r from-transparent via-[var(--accent)]/35 to-transparent md:block"
          />
          <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
            {flow.map((item, index) => (
              <li key={item.title} className="relative text-center md:text-left">
                <div className="mx-auto flex h-[4.3rem] w-[4.3rem] items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--background)] md:mx-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-5 text-[11px] font-bold tracking-[0.18em] text-[var(--accent)] uppercase">
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* Audience rows — editorial, no cards */}
        <div className="mt-20 border-t border-[var(--border)]">
          {audiences.map((item) => (
            <div
              key={item.title}
              className="grid gap-4 border-b border-[var(--border)] py-8 md:grid-cols-[14rem_1fr] md:items-start md:gap-10"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        {/* Concept diagram */}
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
              Intelligence graph
            </p>
            <h3 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Your Twin sits at the center of sources you trust.
            </h3>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
              Not a generic chatbot. Answers come from your knowledge — with
              citations — and refuse to invent when confidence is low.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={ROUTES.signup}>
                  Create your Twin
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {showPageLink ? (
                <Button asChild size="lg" variant="secondary">
                  <Link href={ROUTES.howItHelps}>Read the full story</Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="secondary">
                  <Link href={ROUTES.discover}>Explore experts</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div
              aria-hidden
              className="absolute inset-[12%] rounded-full border border-dashed border-[var(--accent)]/25 animate-pulse-ring"
            />
            <div
              aria-hidden
              className="absolute inset-[24%] rounded-full border border-[var(--border)]"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                <BrainCircuit className="h-8 w-8" />
                <span className="mt-1 text-[10px] font-bold tracking-wide uppercase">
                  Twin
                </span>
              </div>
            </div>
            {[
              { label: "Docs", pos: "top-[8%] left-[18%]" },
              { label: "Notes", pos: "top-[10%] right-[14%]" },
              { label: "FAQs", pos: "bottom-[14%] left-[12%]" },
              { label: "Repos", pos: "bottom-[12%] right-[10%]" },
            ].map((node) => (
              <span
                key={node.label}
                className={`absolute ${node.pos} text-xs font-semibold tracking-wide text-[var(--foreground)]`}
              >
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                {node.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
