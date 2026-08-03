import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

export function DemoSection() {
  return (
    <section className="relative overflow-hidden border-y border-[var(--border)]">
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Grounded answers
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.05]">
            Answers from your knowledge. Citations included.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--muted-foreground)]">
            Every response is grounded in uploaded sources. When confidence is
            low, the Twin says “I don’t know” instead of inventing an answer.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-[var(--muted-foreground)]">
            {[
              "Streaming responses with source citations",
              "Confidence gate that refuses unsupported claims",
              "Public Twin chat when you choose to open it",
            ].map((item) => (
              <li
                key={item}
                className="flex gap-3 border-l-2 border-[var(--accent)]/40 pl-4"
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href={ROUTES.signup}>Try it with your sources</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(15,118,110,0.08),transparent_55%)]"
          />
          <div className="relative space-y-4">
            <div className="ml-auto max-w-[85%] rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm text-[var(--background)]">
              How should we design retrieval for expert twins?
            </div>
            <div className="max-w-[92%] border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--foreground)]">
              Start from the knowledge boundary. Retrieve only from trusted
              sources, score confidence, and escalate to a human when evidence
              is thin.
              <p className="mt-2 text-[11px] font-medium tracking-wide text-[var(--accent)] uppercase">
                Cited · Knowledge Twin Spec §3.1
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
              <span>No hallucination</span>
              <span aria-hidden>·</span>
              <span>Source-linked</span>
              <span aria-hidden>·</span>
              <span>Human escalation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
