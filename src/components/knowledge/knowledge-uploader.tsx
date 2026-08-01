"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ACCEPTED_UPLOAD_EXTENSIONS } from "@/domain/knowledge/mime";

type KnowledgeUploaderProps = {
  organizationId?: string | null;
  uploadUrl?: string;
};

export function KnowledgeUploader({
  organizationId = null,
  uploadUrl = "/api/v1/knowledge",
}: KnowledgeUploaderProps = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);

  function uploadFile(file: File) {
    startTransition(async () => {
      try {
        const form = new FormData();
        form.append("file", file);
        if (organizationId) {
          form.append("organizationId", organizationId);
        }
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: form,
        });
        const json: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof json === "object" &&
            json !== null &&
            "error" in json &&
            typeof (json as { error?: { message?: string } }).error?.message ===
              "string"
              ? (json as { error: { message: string } }).error.message
              : "Upload failed";
          throw new Error(message);
        }
        toast.success("Knowledge processed and ready");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    });
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) uploadFile(file);
      }}
      className={`rounded-[1.75rem] border border-dashed px-6 py-10 text-center transition-colors ${
        dragOver
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--surface)]/70"
      }`}
    >
      <Upload className="mx-auto h-8 w-8 text-[var(--accent)]" />
      <h3 className="mt-4 text-lg font-semibold">Upload knowledge</h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        PDF, Word, PowerPoint, TXT, or Markdown — max 15MB
      </p>
      <div className="mt-5">
        <label>
          <input
            type="file"
            className="hidden"
            accept={ACCEPTED_UPLOAD_EXTENSIONS.join(",")}
            disabled={isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadFile(file);
              event.target.value = "";
            }}
          />
          <Button asChild disabled={isPending}>
            <span>{isPending ? "Processing…" : "Choose file"}</span>
          </Button>
        </label>
      </div>
    </div>
  );
}
