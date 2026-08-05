"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ACCEPTED_UPLOAD_EXTENSIONS } from "@/domain/knowledge/mime";
import { TRAIN_TWIN_LABEL } from "@/config/constants";

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
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  function uploadFile(file: File, overrideTitle?: string) {
    startTransition(async () => {
      try {
        const form = new FormData();
        form.append("file", file);
        if (organizationId) {
          form.append("organizationId", organizationId);
        }
        const resolvedTitle = overrideTitle?.trim();
        if (resolvedTitle) {
          form.append("title", resolvedTitle);
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
        toast.success("Your AI Twin learned this — it’s ready to earn for you");
        setText("");
        setTitle("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
        router.refresh();
      }
    });
  }

  function submitText() {
    const content = text.trim();
    if (!content) {
      toast.error("Add expertise for your Twin to learn first");
      return;
    }

    const safeTitle =
      title.trim() ||
      content.split(/\r?\n/).find((line) => line.trim())?.slice(0, 80) ||
      "Pasted knowledge";
    const fileName = `${safeTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "pasted-knowledge"}.txt`;

    const file = new File([content], fileName, { type: "text/plain" });
    uploadFile(file, safeTitle);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-10 lg:items-stretch">
      {/* 70% — paste / type knowledge */}
      <div className="flex min-h-[280px] flex-col rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)]/70 p-5 lg:col-span-7">
        <div className="mb-3">
          <h3 className="text-lg font-semibold">Add expertise (text)</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Notes, FAQs, or write-ups — what you want your Twin to represent when
            people ask (and before they pay you).
          </p>
        </div>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title (optional)"
          disabled={isPending}
          className="mb-3"
        />
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste or write what you know…"
          disabled={isPending}
          className="min-h-[160px] flex-1 resize-y"
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--muted)]">
            Trains your Twin like a document upload.
          </p>
          <Button
            type="button"
            disabled={isPending || !text.trim()}
            onClick={submitText}
          >
            {isPending ? "Training…" : "Train Twin"}
          </Button>
        </div>
      </div>

      {/* 30% — existing file upload */}
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
        className={`flex min-h-[280px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed px-4 py-8 text-center transition-colors lg:col-span-3 ${
          dragOver
            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-[var(--border)] bg-[var(--surface)]/70"
        }`}
      >
        <Upload className="h-8 w-8 text-[var(--accent)]" />
        <h3 className="mt-4 text-base font-semibold">Upload a file</h3>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          PDF, Word, PowerPoint, TXT, or Markdown — max 15MB. Feeds your{" "}
          {TRAIN_TWIN_LABEL} flow.
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
            <Button asChild disabled={isPending} variant="secondary">
              <span>{isPending ? "Training…" : "Choose file"}</span>
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
}
