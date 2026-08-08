import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

type InfoContentSectionProps = {
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function InfoContentSection({
  title,
  children,
  icon: Icon,
  className,
}: InfoContentSectionProps) {
  return (
    <GlassCard className={cn("p-6 sm:p-8", className)}>
      <div className="flex gap-4">
        {Icon ? (
          <div className="hidden shrink-0 sm:block">
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--accent-soft)] p-3">
              <Icon className="h-6 w-6 text-[var(--accent)]" aria-hidden />
            </div>
          </div>
        ) : null}
        <div className="prose prose-neutral min-w-0 max-w-none dark:prose-invert prose-headings:font-display prose-headings:tracking-tight prose-h2:mb-3 prose-h2:mt-0 prose-h2:text-xl prose-h2:font-bold prose-p:text-[var(--muted-foreground)] prose-li:text-[var(--muted-foreground)] prose-a:text-[var(--accent)]">
          <h2>{title}</h2>
          {children}
        </div>
      </div>
    </GlassCard>
  );
}

export function InfoPageIntro({ children }: { children: ReactNode }) {
  return (
    <p className="mb-8 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)]">
      {children}
    </p>
  );
}
