import {
  BookOpen,
  BrainCircuit,
  CircleDollarSign,
  FileText,
  MessageSquareQuote,
  Network,
  Rocket,
  ScanSearch,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type InfographicPanelProps = {
  className?: string;
  variant?: "pipeline" | "network" | "value";
};

export function InfographicPanel({
  className,
  variant = "pipeline",
}: InfographicPanelProps) {
  if (variant === "network") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] border border-[var(--glass-border)] bg-[var(--glass)] p-6 shadow-[var(--glass-shadow)] backdrop-blur-xl",
          className,
        )}
      >
        <div className="pointer-events-none absolute -top-10 -right-8 h-40 w-40 rounded-full bg-[var(--accent)]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-sky-400/15 blur-3xl" />

        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
          Your intelligence graph
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">
          Sources in. Twin out. Citations always on.
        </h3>

        <div className="relative mt-8 grid place-items-center py-4">
          <div className="absolute h-40 w-40 rounded-full border border-dashed border-[var(--accent)]/30 animate-pulse-ring" />
          <div className="absolute h-28 w-28 rounded-full border border-[var(--border)]" />

          <div className="relative z-10 flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg">
            <BrainCircuit className="h-7 w-7" />
            <span className="mt-1 text-[10px] font-bold tracking-wide uppercase">
              Twin
            </span>
          </div>

          {[
            { icon: FileText, label: "Docs", pos: "top-2 left-6" },
            { icon: BookOpen, label: "Notes", pos: "top-2 right-6" },
            { icon: MessageSquareQuote, label: "FAQs", pos: "bottom-2 left-8" },
            { icon: Network, label: "Repos", pos: "bottom-2 right-8" },
          ].map((node) => (
            <div
              key={node.label}
              className={cn(
                "absolute flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs font-medium shadow-sm",
                node.pos,
              )}
            >
              <node.icon className="h-3.5 w-3.5 text-[var(--accent)]" />
              {node.label}
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Not a generic chatbot. Your Twin only answers from the knowledge you
          trust — and shows where each answer came from.
        </p>
      </div>
    );
  }

  if (variant === "value") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] border border-[var(--glass-border)] bg-[var(--glass)] p-6 shadow-[var(--glass-shadow)] backdrop-blur-xl",
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-24 bg-gradient-to-b from-[var(--accent)]/15 to-transparent" />
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
          Who wins
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">
          Experts scale. Learners get answers. Both save time.
        </h3>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <Users className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-semibold">Experts</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
              <li>Answer FAQs once via Twin</li>
              <li>Open public chat when ready</li>
              <li>Sell consults & knowledge packs</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <ScanSearch className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-semibold">Learners</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
              <li>Ask anytime, get cited replies</li>
              <li>Discover by skill & topic</li>
              <li>Book a human when it matters</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2.5 text-xs font-medium text-[var(--foreground)]">
          <CircleDollarSign className="h-4 w-4 text-[var(--accent)]" />
          Marketplace turns expertise into recurring value — without content burnout.
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-[var(--glass-border)] bg-[var(--glass)] p-6 shadow-[var(--glass-shadow)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 top-0 h-32 w-32 rounded-full bg-sky-400/15 blur-3xl" />
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        How Smitvi works
      </p>
      <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">
        From expertise to a live Knowledge Twin
      </h3>

      <div className="mt-6 grid gap-3">
        {[
          {
            step: "01",
            icon: FileText,
            title: "Upload your mind",
            body: "PDFs, notes, decks, FAQs — the artifacts of your real expertise.",
          },
          {
            step: "02",
            icon: BrainCircuit,
            title: "Index into a Twin",
            body: "We chunk, embed, and structure knowledge so answers stay grounded.",
          },
          {
            step: "03",
            icon: Rocket,
            title: "Launch & monetize",
            body: "Open public chat, get discovered, and sell consultations or packs.",
          },
        ].map((item, index) => (
          <div
            key={item.step}
            className={cn(
              "relative flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4",
              index === 2 && "ring-1 ring-[var(--accent)]/40",
            )}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--accent)] uppercase">
                Step {item.step}
              </p>
              <p className="mt-1 text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
