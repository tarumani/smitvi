import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  label?: string;
};

/** Inline spinner — use on buttons or beside status text (no scroll needed). */
export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <span
        className={cn(
          "inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent",
          className,
        )}
        aria-hidden
      />
      {label ? (
        <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      ) : null}
    </span>
  );
}

type BusyOverlayProps = {
  active: boolean;
  label?: string;
};

/** Fixed overlay for full-step actions (onboarding continue, save profile). */
export function BusyOverlay({ active, label = "Working…" }: BusyOverlayProps) {
  if (!active) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/75 backdrop-blur-[2px]"
      aria-live="polite"
      aria-busy
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-8 py-6 shadow-lg">
        <Spinner className="h-8 w-8 border-[3px]" />
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
      </div>
    </div>
  );
}
