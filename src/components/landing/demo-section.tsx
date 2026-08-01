import { TwinChatDemo } from "@/components/landing/twin-chat-demo";

export function DemoSection() {
  return (
    <section id="demo" className="relative border-y border-[var(--border)]">
      <div className="absolute inset-0 bg-[var(--surface)]/40" />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Twin chat
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.05]">
            Answers from your knowledge. Citations included. No hallucination.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--muted-foreground)]">
            Every response is grounded in uploaded sources. When confidence is
            low, the Twin says “I don’t know” instead of inventing an answer.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-[var(--muted-foreground)]">
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              Streaming responses with markdown and code highlighting
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              Source citations from your documents and notes
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              Confidence gate that refuses unsupported claims
            </li>
          </ul>
        </div>
        <TwinChatDemo compact />
      </div>
    </section>
  );
}
