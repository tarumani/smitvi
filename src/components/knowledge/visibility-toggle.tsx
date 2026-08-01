"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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

  function toggle() {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/v1/knowledge/${sourceId}/visibility`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPublic: !isPublic }),
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
        toast.success(!isPublic ? "Published to public profile" : "Made private");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Update failed");
      }
    });
  }

  return (
    <Button
      size="sm"
      variant={isPublic ? "secondary" : "outline"}
      onClick={toggle}
      disabled={isPending}
    >
      {isPublic ? "Public" : "Private"}
    </Button>
  );
}
