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

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b1220] text-white shadow-[0_40px_120px_rgba(2,8,23,0.45)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-white/10",
          compact ? "px-4 py-3" : "px-5 py-4",
        )}
      >
        <div>
          <p className="text-sm font-semibold tracking-tight">Knowledge Twin</p>
          <p className="text-xs text-white/50">@maya · Product Architect</p>
        </div>
        <span className="rounded-md bg-teal-400/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-teal-300">
          LIVE
        </span>
      </div>

      <div
        className={cn(
          "space-y-3 overflow-y-auto px-4 py-4",
          compact ? "max-h-[220px] min-h-[180px]" : "min-h-[320px] sm:min-h-[380px] sm:space-y-4 sm:px-5 sm:py-5",
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
                "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                message.role === "user"
                  ? "bg-white/10 text-white"
                  : "bg-teal-400/10 text-teal-50 ring-1 ring-teal-400/20",
              )}
            >
              {message.text}
            </div>
            {message.citation ? (
              <p className="mt-1.5 text-[11px] text-white/40">
                Cited from {message.citation}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "border-t border-white/10",
          compact ? "px-4 py-3" : "px-5 py-4",
        )}
      >
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/35">
          Ask this twin anything from their knowledge…
        </div>
      </div>
    </div>
  );
}
