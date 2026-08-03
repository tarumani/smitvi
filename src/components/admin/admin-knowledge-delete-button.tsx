"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type AdminKnowledgeDeleteButtonProps = {
  sourceId: string;
  title: string;
};

export function AdminKnowledgeDeleteButton({
  sourceId,
  title,
}: AdminKnowledgeDeleteButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(
      `Delete “${title}”? This removes the upload and its chunks permanently.`,
    );
    if (!ok) return;

    setPending(true);
    try {
      const res = await fetch(`/api/v1/admin/knowledge/${sourceId}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(json.error?.message ?? "Delete failed");
      }
      toast.success("Upload deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={() => void handleDelete()}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
