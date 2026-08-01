import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  icon?: ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
  className,
  icon,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/60 px-6 py-14 text-center",
        className,
      )}
    >
      {icon}
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="max-w-md text-sm text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
