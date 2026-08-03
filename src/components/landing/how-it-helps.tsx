import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  GraduationCap,
  Users,
  FileText,
  BrainCircuit,
  Rocket,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiNetworkCanvas } from "@/components/landing/ai-network-canvas";
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
    metric: "Scale once",
  },
  {
    icon: GraduationCap,
    title: "Learners & teams",
    body: "Ask anytime for grounded answers. Discover by skill — hire a human when it matters.",
    metric: "Ask anytime",
  },
  {
    icon: Users,
    title: "Organizations",
    body: "Shared workspace Twins keep institutional memory searchable and onboarding fast.",
    metric: "Shared memory",
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
    <>
      {/* Band 1 — How it helps / process console */}
      <section id="how-it-helps" className="relative overflow-hidden">
        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
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

          <div className="mt-12 overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
              <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                Twin pipeline
              </p>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                Live flow
              </span>
            </div>
            <ol className="grid md:grid-cols-3">
              {flow.map((item, index) => (
                <li
                  key={item.title}
                  className="relative border-b border-[var(--border)] p-6 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="font-display text-2xl font-extrabold text-[var(--accent)]/25">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Band 2 — Who it’s for (tinted surface, metric tiles) */}
      <section className="relative overflow-hidden border-y border-[var(--border)] bg-[var(--surface)]/55">
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
                Built for
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-4xl">
                One network. Three ways in.
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {audiences.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-[0.12em] text-[var(--accent)] uppercase">
                    {item.metric}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Band 3 — Intelligence graph as dark product portal */}
      <section className="relative overflow-hidden bg-[#0b1220] text-white">
        <AiNetworkCanvas className="opacity-40" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-28">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-teal-300 uppercase">
              Intelligence graph
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.05]">
              Your Twin sits at the center of sources you trust.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/65">
              Not a generic chatbot. Answers come from your knowledge — with
              citations — and refuse to invent when confidence is low.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-teal-300" />
                Grounded retrieval from your uploads only
              </li>
              <li className="flex items-center gap-3">
                <Quote className="h-4 w-4 text-teal-300" />
                Source citations on every supported answer
              </li>
              <li className="flex items-center gap-3">
                <BrainCircuit className="h-4 w-4 text-teal-300" />
                Honest “I don’t know” outside the graph
              </li>
            </ul>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-teal-400 text-[#042f2e] hover:bg-teal-300"
              >
                <Link href={ROUTES.signup}>
                  Create your Twin
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {showPageLink ? (
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href={ROUTES.howItHelps}>Read the full story</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href={ROUTES.discover}>Explore experts</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Product-style graph panel */}
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Knowledge graph</p>
                <p className="text-xs text-white/45">@you · private twin</p>
              </div>
              <span className="rounded-md bg-teal-400/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-teal-300">
                INDEXED
              </span>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-sm">
              <div
                aria-hidden
                className="absolute inset-[10%] rounded-full border border-dashed border-teal-300/25 animate-pulse-ring"
              />
              <div
                aria-hidden
                className="absolute inset-[24%] rounded-full border border-white/10"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-teal-400 text-[#042f2e] shadow-[0_0_40px_rgba(45,212,191,0.35)]">
                  <BrainCircuit className="h-8 w-8" />
                  <span className="mt-1 text-[10px] font-bold tracking-wide uppercase">
                    Twin
                  </span>
                </div>
              </div>
              {[
                { label: "Docs", pos: "top-[6%] left-[10%]" },
                { label: "Notes", pos: "top-[8%] right-[8%]" },
                { label: "FAQs", pos: "bottom-[12%] left-[6%]" },
                { label: "Repos", pos: "bottom-[10%] right-[4%]" },
              ].map((node) => (
                <span
                  key={node.label}
                  className={`absolute ${node.pos} rounded-full border border-white/15 bg-[#0b1220]/90 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/90`}
                >
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-teal-300" />
                  {node.label}
                </span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center text-[11px] text-white/50">
              <div>
                <p className="font-semibold text-teal-300">Sources</p>
                <p className="mt-0.5">Connected</p>
              </div>
              <div>
                <p className="font-semibold text-teal-300">Retrieval</p>
                <p className="mt-0.5">Cited</p>
              </div>
              <div>
                <p className="font-semibold text-teal-300">Confidence</p>
                <p className="mt-0.5">Gated</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
