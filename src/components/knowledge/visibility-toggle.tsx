"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
    if (nextPublic === isPublic) return;
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
          nextPublic ? "Visible on your public profile" : "Kept private",
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Update failed");
      }
    });
  }

  const switchId = `source-visibility-${sourceId}`;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-2 sm:min-w-[11rem]">
      <Label
        htmlFor={switchId}
        className="text-xs font-medium text-[var(--muted-foreground)]"
      >
        {isPublic ? "Public" : "Private"}
      </Label>
      <Switch
        id={switchId}
        checked={isPublic}
        disabled={isPending}
        aria-label={isPublic ? "Public on profile" : "Private to you"}
        onCheckedChange={setPublic}
      />
    </div>
  );
}
