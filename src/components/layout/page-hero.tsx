import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
  align?: "left" | "center";
};

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  className,
  align = "left",
}: PageHeroProps) {
  return (
    <div
      className={cn(
        "animate-fade-up",
        align === "center" && "mx-auto max-w-3xl text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={cn(
          "font-display text-4xl font-bold tracking-tight sm:text-5xl",
          eyebrow && "mt-3",
        )}
      >
        {title}
      </h1>
      <p
        className={cn(
          "mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg",
          align === "center" && "mx-auto",
        )}
      >
        {description}
      </p>
      {actions ? (
        <div
          className={cn(
            "mt-7 flex flex-wrap gap-3",
            align === "center" && "justify-center",
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
