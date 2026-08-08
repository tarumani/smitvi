"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type VisibilityToggleProps = {
  sourceId: string;
  isPublic: boolean;
};

export function VisibilityToggle({
  sourceId,
  isPublic,
}: VisibilityToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setPublic(nextPublic: boolean) {
    if (nextPublic === isPublic || isPending) return;
    startTransition(async () => {
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
          nextPublic ? "Shown on your public hub" : "Private to your Twin only",
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Update failed");
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--foreground)]">
        Visibility
      </p>
      <div
        className="inline-flex w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 sm:w-auto"
        role="group"
        aria-label="Source visibility"
      >
        <button
          type="button"
          disabled={isPending}
          aria-pressed={!isPublic}
          onClick={() => setPublic(false)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none sm:px-4",
            !isPublic
              ? "bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
          )}
        >
          Private
        </button>
        <button
          type="button"
          disabled={isPending}
          aria-pressed={isPublic}
          onClick={() => setPublic(true)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none sm:px-4",
            isPublic
              ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-sm"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
          )}
        >
          Public
        </button>
      </div>
      <p className="text-[11px] leading-snug text-[var(--muted)]">
        {isPublic
          ? "Visitors on your public hub can see and chat with content from this source."
          : "Only you (and your Twin in private chat) can use this source."}
      </p>
    </div>
  );
}
