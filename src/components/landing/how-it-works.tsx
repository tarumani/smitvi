import { ConnectSourceGrid, ConnectSourcesMarketingCta } from "@/components/knowledge/connect-source-grid";

const steps = [
  {
    step: "01",
    title: "Claim your identity",
    description:
      "Pick your @username — the public URL of your Intelligence Hub.",
  },
  {
    step: "02",
    title: "Train your AI Twin",
    description:
      "Connect LinkedIn, docs, Notion, and more — your hub learns from what you already know.",
  },
  {
    step: "03",
    title: "Launch and earn",
    description:
      "Get discovered on the network, take consults, and sell on the marketplace.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative overflow-hidden bg-[var(--surface-elevated)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,rgba(15,118,110,0.1),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="max-w-md lg:sticky lg:top-24">
            <p className="text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
              How it works
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              From expertise to Twin in three steps
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--muted-foreground)]">
              A clear path from profile to live Twin — without rebuilding your
              knowledge every time someone asks.
            </p>
          </div>

          <ol className="relative space-y-0 border-l border-[var(--accent)]/30 pl-8">
            {steps.map((item) => (
              <li key={item.step} className="relative pb-12 last:pb-0">
                <span
                  aria-hidden
                  className="absolute top-1.5 -left-[2.15rem] flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-[var(--accent-foreground)]"
                >
                  {item.step}
                </span>
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
                  {item.description}
                </p>
                {item.step === "02" ? (
                  <>
                    <ConnectSourceGrid mode="marketing" />
                    <ConnectSourcesMarketingCta />
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
