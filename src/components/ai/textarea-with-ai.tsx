"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type AiGeneratePurpose =
  | "profile_bio"
  | "marketplace_listing"
  | "consultation_offer"
  | "generic";

type TextareaWithAiProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  purpose: AiGeneratePurpose;
  hint?: string;
  title?: string;
  listingType?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  generateLabel?: string;
};

export function TextareaWithAi({
  id,
  label,
  value,
  onChange,
  purpose,
  hint,
  title,
  listingType,
  placeholder,
  required,
  disabled,
  rows = 4,
  generateLabel = "Generate with AI",
}: TextareaWithAiProps) {
  const [isPending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/ai/generate-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            purpose,
            hint: hint || value || undefined,
            title,
            listingType,
          }),
        });
        const json = (await response.json()) as {
          data?: { text?: string };
          error?: { message?: string };
        };
        if (!response.ok) {
          throw new Error(json.error?.message ?? "Generation failed");
        }
        const text = json.data?.text?.trim();
        if (!text) throw new Error("Empty response");
        onChange(text);
        toast.success("AI draft inserted — edit before saving");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Generation failed");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span className="text-[var(--destructive)]" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </Label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || isPending}
          onClick={generate}
          className="h-8 gap-1.5"
        >
          {isPending ? (
            <Spinner className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          )}
          {isPending ? "Generating…" : generateLabel}
        </Button>
      </div>
      <Textarea
        id={id}
        required={required}
        disabled={disabled || isPending}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(isPending && "opacity-70")}
      />
      {isPending ? (
        <p className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Spinner className="h-3 w-3" />
          Drafting AdSense-safe copy…
        </p>
      ) : null}
    </div>
  );
}
