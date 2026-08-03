import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

export function DemoSection() {
  return (
    <section className="relative overflow-hidden bg-[#0f766e] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.14),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(14,165,233,0.22),transparent_45%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:40px_40px]"
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-teal-100 uppercase">
            Grounded answers
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.05]">
            Answers from your knowledge. Citations included.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/80">
            Every response is grounded in uploaded sources. When confidence is
            low, the Twin says “I don’t know” instead of inventing an answer.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-white/85">
            {[
              "Streaming responses with source citations",
              "Confidence gate that refuses unsupported claims",
              "Public Twin chat when you choose to open it",
            ].map((item) => (
              <li
                key={item}
                className="flex gap-3 border-l-2 border-white/50 pl-4"
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="bg-white text-[#0f766e] hover:bg-white/90"
            >
              <Link href={ROUTES.signup}>Try it with your sources</Link>
            </Button>
          </div>
        </div>

        <div className="relative space-y-4">
          <div className="ml-auto max-w-[85%] rounded-2xl bg-white/15 px-4 py-3 text-sm text-white backdrop-blur-sm">
            How should we design retrieval for expert twins?
          </div>
          <div className="max-w-[92%] rounded-2xl bg-[#042f2e]/35 px-4 py-3 text-sm leading-relaxed text-teal-50 ring-1 ring-white/20">
            Start from the knowledge boundary. Retrieve only from trusted
            sources, score confidence, and escalate to a human when evidence is
            thin.
            <p className="mt-2 text-[11px] font-medium tracking-wide text-teal-100 uppercase">
              Cited · Knowledge Twin Spec §3.1
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold tracking-[0.12em] text-white/60 uppercase">
            <span>No hallucination</span>
            <span aria-hidden>·</span>
            <span>Source-linked</span>
            <span aria-hidden>·</span>
            <span>Human escalation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
