"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type VisibilityToggleProps = {
  sourceId: string;
  isPublic: boolean;
  /** Shown in the public option, e.g. @vinod */
  username?: string | null;
};

export function VisibilityToggle({
  sourceId,
  isPublic,
  username,
}: VisibilityToggleProps) {
  const router = useRouter();
  const [activePublic, setActivePublic] = useState(isPublic);
  const [saving, setSaving] = useState(false);
  const handle = username ? `@${username}` : "your public hub";

  useEffect(() => {
    setActivePublic(isPublic);
  }, [isPublic]);

  async function setPublic(nextPublic: boolean) {
    if (nextPublic === activePublic || saving) return;

    const previous = activePublic;
    setActivePublic(nextPublic);
    setSaving(true);

    try {
      const response = await fetch(
        `/api/v1/knowledge/${sourceId}/visibility`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublic: nextPublic }),
        },
      );
      const json: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof json === "object" &&
          json !== null &&
          "error" in json &&
          typeof (json as { error?: { message?: string } }).error?.message ===
            "string"
            ? (json as { error: { message: string } }).error.message
            : "Update failed";
        throw new Error(message);
      }
      toast.success(
        nextPublic
          ? `This source is now on ${handle}`
          : "This source is private to your Twin",
      );
      router.refresh();
    } catch (error) {
      setActivePublic(previous);
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-[var(--foreground)]">
        Who can use this source?
      </legend>
      <p className="text-xs text-[var(--muted-foreground)]">
        Tap an option — your choice updates right away.
      </p>

      <div
        className={cn(
          "grid gap-2 sm:grid-cols-2",
          saving && "pointer-events-none opacity-80",
        )}
        role="group"
        aria-label="Source visibility"
        aria-busy={saving}
      >
        <OptionCard
          selected={!activePublic}
          icon={Lock}
          title="Keep private"
          description="For Twin Chat and training only. Hidden from your public profile."
          actionLabel={
            !activePublic ? "Currently selected" : "Tap to make private"
          }
          onSelect={() => setPublic(false)}
        />
        <OptionCard
          selected={activePublic}
          icon={Globe}
          title="Share on public hub"
          description={`Visitors on ${handle} can chat using content from this source.`}
          actionLabel={
            activePublic ? "Currently selected" : "Tap to share publicly"
          }
          onSelect={() => setPublic(true)}
        />
      </div>
    </fieldset>
  );
}

function OptionCard({
  selected,
  icon: Icon,
  title,
  description,
  actionLabel,
  onSelect,
}: {
  selected: boolean;
  icon: typeof Lock;
  title: string;
  description: string;
  actionLabel: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative flex w-full cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 text-left transition-[border-color,background-color,box-shadow,transform] duration-100 active:scale-[0.99]",
        selected
          ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]/25"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/40 hover:bg-[var(--surface-elevated)]",
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            selected
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--surface-elevated)] text-[var(--muted-foreground)]",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {selected ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[var(--accent-foreground)] uppercase">
            <Check className="h-3 w-3" aria-hidden />
            Active
          </span>
        ) : null}
      </div>
      <span className="font-semibold text-[var(--foreground)]">{title}</span>
      <span className="text-xs leading-relaxed text-[var(--muted-foreground)]">
        {description}
      </span>
      <span
        className={cn(
          "text-[11px] font-medium",
          selected ? "text-[var(--accent)]" : "text-[var(--muted)]",
        )}
      >
        {actionLabel}
      </span>
    </button>
  );
}
