"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const transcript = [
  {
    role: "user" as const,
    text: "How do you approach system design for AI products?",
  },
  {
    role: "twin" as const,
    text: "I start from the knowledge boundary. Define what the twin may answer from uploaded sources, then design retrieval, confidence gates, and human escalation.",
    citation: "AI Product Playbook · p.14",
  },
  {
    role: "user" as const,
    text: "What if confidence is low?",
  },
  {
    role: "twin" as const,
    text: "I don't know — and I say so. Smitvi twins refuse to invent answers outside their knowledge graph.",
    citation: "Knowledge Twin Spec · §4.2",
  },
];

type TwinChatDemoProps = {
  className?: string;
  compact?: boolean;
};

export function TwinChatDemo({ className, compact = false }: TwinChatDemoProps) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (visibleCount >= transcript.length) return;
    const timer = window.setTimeout(() => {
      setVisibleCount((count) => count + 1);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [visibleCount]);

  const isTyping = visibleCount < transcript.length;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-[0_12px_36px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-[var(--border)]",
          compact ? "px-4 py-3" : "px-5 py-4",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
            <span className="text-[10px] font-bold">KT</span>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Knowledge Twin</p>
            <p className="text-xs text-[var(--muted)]">@maya · Product Architect</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[var(--accent)]">
          <span className="animate-live-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          LIVE
        </span>
      </div>

      <div
        className={cn(
          "space-y-3 overflow-hidden px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          compact
            ? "h-[230px]"
            : "min-h-[320px] sm:min-h-[380px] sm:space-y-4 sm:px-5 sm:py-5",
        )}
      >
        {transcript.slice(0, visibleCount).map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={cn(
              "animate-fade-up max-w-[92%]",
              message.role === "user" ? "ml-auto" : "mr-auto",
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                message.role === "user"
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-[var(--accent-soft)] text-[var(--foreground)]",
              )}
            >
              {message.text}
            </div>
            {message.citation ? (
              <p className="mt-1.5 text-[11px] text-[var(--muted)]">
                Cited from {message.citation}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {/* Status footer — intentionally not a search/input field */}
      <div
        className={cn(
          "flex items-center justify-between border-t border-[var(--border)]",
          compact ? "px-4 py-2.5" : "px-5 py-3",
        )}
      >
        {isTyping ? (
          <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className="inline-flex gap-0.5">
              <span className="animate-live-dot h-1 w-1 rounded-full bg-[var(--accent)]" />
              <span className="animate-live-dot h-1 w-1 rounded-full bg-[var(--accent)] [animation-delay:0.2s]" />
              <span className="animate-live-dot h-1 w-1 rounded-full bg-[var(--accent)] [animation-delay:0.4s]" />
            </span>
            Twin is answering…
          </p>
        ) : (
          <p className="text-xs text-[var(--muted)]">Conversation grounded in sources</p>
        )}
        <p className="text-[11px] font-medium text-[var(--accent)]">Preview only</p>
      </div>
    </div>
  );
}
