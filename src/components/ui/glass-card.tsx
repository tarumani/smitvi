import * as React from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[var(--glass-border)] bg-[var(--glass)] shadow-[var(--glass-shadow)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
