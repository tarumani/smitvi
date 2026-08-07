"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { readApiDataField, readApiErrorMessage } from "@/lib/api-response";

type Props = {
  displayName: string;
  avatarUrl: string | null;
  onUploaded: (avatarUrl: string) => void;
  className?: string;
};

export function ProfileAvatarUpload({
  displayName,
  avatarUrl,
  onUploaded,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [isPending, startTransition] = useTransition();

  function openPicker() {
    inputRef.current?.click();
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    startTransition(async () => {
      try {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/v1/profiles/me/avatar", {
          method: "POST",
          body: form,
        });
        const json: unknown = await response.json();
        if (!response.ok) {
          throw new Error(readApiErrorMessage(json, "Upload failed"));
        }
        const url = readApiDataField(json, "avatarUrl");
        if (!url) throw new Error("Upload failed");
        const cacheBusted = `${url}?v=${Date.now()}`;
        setPreview(cacheBusted);
        onUploaded(url);
        toast.success("Profile photo updated");
      } catch (error) {
        setPreview(avatarUrl);
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    });
  }

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start", className)}>
      <Avatar
        src={preview || avatarUrl}
        name={displayName}
        className="h-20 w-20 shrink-0"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <Label>Profile photo</Label>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={onFileChange}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={openPicker}
          className="w-full sm:w-auto"
        >
          <Upload className="h-4 w-4" />
          {isPending ? "Uploading…" : "Browse & upload"}
        </Button>
        <p className="text-xs text-[var(--muted)]">
          JPEG, PNG, WebP, or GIF · max 5 MB. Adds +10 to your Human Intelligence
          Score.
        </p>
      </div>
    </div>
  );
}
