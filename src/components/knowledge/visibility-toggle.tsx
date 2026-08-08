"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type VisibilityToggleProps = {
  sourceId: string;
  isPublic: boolean;
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
  const handle = username ? `@${username}` : "your hub";

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
          ? `Now visible on ${handle}`
          : "Set to private for your Twin",
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
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--muted-foreground)]">
        Visibility
      </p>
      <div
        className={cn(
          "flex max-w-lg flex-wrap gap-2",
          saving && "pointer-events-none opacity-70",
        )}
        role="group"
        aria-label="Source visibility"
        aria-busy={saving}
      >
        <SmallOptionCard
          selected={!activePublic}
          icon={Lock}
          title="Private"
          hint="Twin chat only"
          onSelect={() => setPublic(false)}
        />
        <SmallOptionCard
          selected={activePublic}
          icon={Globe}
          title="Public"
          hint={`On ${handle}`}
          onSelect={() => setPublic(true)}
        />
      </div>
    </div>
  );
}

function SmallOptionCard({
  selected,
  icon: Icon,
  title,
  hint,
  onSelect,
}: {
  selected: boolean;
  icon: typeof Lock;
  title: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={hint}
      className={cn(
        "inline-flex min-w-[7.5rem] max-w-[11rem] flex-1 cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-[border-color,background-color,transform] duration-100 active:scale-[0.98] sm:flex-none",
        selected
          ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/30"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/35 hover:bg-[var(--surface-elevated)]",
      )}
    >
      <span
        className={cn(
          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
          selected
            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
            : "bg-[var(--surface-elevated)] text-[var(--muted-foreground)]",
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-sm font-semibold leading-none text-[var(--foreground)]">
          {title}
          {selected ? (
            <Check className="h-3 w-3 shrink-0 text-[var(--accent)]" aria-hidden />
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-[10px] text-[var(--muted)]">
          {hint}
        </span>
      </span>
    </button>
  );
}
