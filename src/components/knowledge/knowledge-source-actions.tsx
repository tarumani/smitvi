"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readApiErrorMessage } from "@/lib/api-response";

type Props = {
  sourceId: string;
  title: string;
  canDelete?: boolean;
};

export function KnowledgeSourceActions({
  sourceId,
  title,
  canDelete = true,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [isPending, startTransition] = useTransition();

  function saveTitle() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/knowledge/${sourceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: draftTitle.trim() }),
        });
        const json: unknown = await response.json();
        if (!response.ok) {
          throw new Error(readApiErrorMessage(json, "Could not save title"));
        }
        toast.success("Title updated");
        setEditing(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  }

  function removeSource() {
    if (
      !window.confirm(
        "Remove this training source? Your Twin will no longer use this content.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/knowledge/${sourceId}`, {
          method: "DELETE",
        });
        const json: unknown = await response.json();
        if (!response.ok) {
          throw new Error(readApiErrorMessage(json, "Could not delete"));
        }
        toast.success("Source removed");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Delete failed");
      }
    });
  }

  if (editing) {
    return (
      <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
        <Input
          value={draftTitle}
          disabled={isPending}
          onChange={(event) => setDraftTitle(event.target.value)}
          className="h-9"
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={isPending} onClick={saveTitle}>
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isPending}
            onClick={() => {
              setDraftTitle(title);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isPending}
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-4 w-4" />
        Edit title
      </Button>
      {canDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="text-red-600 hover:text-red-700 dark:text-red-400"
          onClick={removeSource}
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </Button>
      ) : null}
    </div>
  );
}
