const pillars = [
  {
    title: "Own your intelligence",
    description:
      "Upload documents, repos, lectures, and notes. Your twin learns only from sources you trust.",
  },
  {
    title: "Answer at scale",
    description:
      "Public AI chat with citations, confidence gates, and an honest “I don’t know” when evidence is thin.",
  },
  {
    title: "Monetize without burnout",
    description:
      "Subscriptions, consultations, and marketplace access — without endless content production.",
  },
] as const;

export function ProductSection() {
  return (
    <section id="product" className="relative overflow-hidden">
      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
        <div className="max-w-2xl">
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

        <div className="mt-14 grid gap-0 border-t border-[var(--border)] md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <article
              key={pillar.title}
              className="border-b border-[var(--border)] py-8 md:border-r md:border-b-0 md:px-8 md:py-10 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            >
              <p className="font-display text-sm font-bold tracking-[0.2em] text-[var(--accent)]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">
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
