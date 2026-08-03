import { BrainCircuit, MessageSquareQuote, Wallet } from "lucide-react";

const pillars = [
  {
    icon: BrainCircuit,
    title: "Own your intelligence",
    description:
      "Upload documents, repos, lectures, and notes. Your twin learns only from sources you trust.",
  },
  {
    icon: MessageSquareQuote,
    title: "Answer at scale",
    description:
      "Public AI chat with citations, confidence gates, and an honest “I don’t know” when evidence is thin.",
  },
  {
    icon: Wallet,
    title: "Monetize without burnout",
    description:
      "Subscriptions, consultations, and marketplace access — without endless content production.",
  },
] as const;

export function ProductSection() {
  return (
    <section
      id="product"
      className="relative overflow-hidden border-y border-[var(--border)] bg-[var(--surface)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.1),transparent_50%)]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Product
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.05]">
            The operating system for expert knowledge
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--muted-foreground)]">
            Google indexes websites. LinkedIn indexes professionals. Smitvi
            indexes human intelligence.
          </p>
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          {pillars.map((pillar, index) => (
            <article key={pillar.title} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <pillar.icon className="h-6 w-6" />
              </div>
              <p className="mt-5 text-[11px] font-bold tracking-[0.18em] text-[var(--accent)] uppercase">
                Pillar {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
