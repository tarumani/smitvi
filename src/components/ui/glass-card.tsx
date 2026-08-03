import * as React from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--glass)] shadow-[var(--glass-shadow)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-0.5",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent",
        "after:pointer-events-none after:absolute after:-right-10 after:-top-10 after:h-28 after:w-28 after:rounded-full after:bg-[var(--accent)]/10 after:blur-2xl",
        className,
      )}
      {...props}
    />
  );
}
