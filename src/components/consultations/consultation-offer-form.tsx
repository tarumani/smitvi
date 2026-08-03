"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ConsultationOfferFormValues = {
  enabled: boolean;
  headline: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
};

type ConsultationOfferFormProps = {
  initial: ConsultationOfferFormValues;
};

export function ConsultationOfferForm({ initial }: ConsultationOfferFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(initial);
  const [priceAmount, setPriceAmount] = useState(
    () => (initial.priceCents / 100).toFixed(2),
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const dollars = Number(priceAmount);
        const priceCents = Number.isFinite(dollars)
          ? Math.round(dollars * 100)
          : 0;
        const response = await fetch("/api/v1/consultations/offer", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: form.enabled,
            headline: form.headline || null,
            description: form.description || null,
            durationMinutes: form.durationMinutes,
            priceCents,
            currency: form.currency,
          }),
        });
        const json = (await response.json()) as { error?: { message?: string } };
        if (!response.ok) {
          throw new Error(json.error?.message ?? "Failed to save offer");
        }
        toast.success(
          form.enabled
            ? "Consultations enabled on your profile"
            : "Consultation offer saved",
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={form.enabled}
          disabled={isPending}
          onChange={(event) =>
            setForm((current) => ({ ...current, enabled: event.target.checked }))
          }
          className="h-4 w-4 rounded border-[var(--border)]"
        />
        Accept consultation requests on my public profile
      </label>

      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          value={form.headline}
          disabled={isPending}
          onChange={(event) =>
            setForm((current) => ({ ...current, headline: event.target.value }))
          }
          placeholder="1:1 design review or strategy call"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          disabled={isPending}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="What you’ll cover, who it’s for, and how you’ll follow up…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min={15}
            max={240}
            step={15}
            value={form.durationMinutes}
            disabled={isPending}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                durationMinutes: Number(event.target.value),
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step={1}
            value={priceAmount}
            disabled={isPending}
            onChange={(event) => setPriceAmount(event.target.value)}
          />
          <p className="text-xs text-[var(--muted)]">
            {form.currency} · use 0 for a free intro call
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={form.currency}
            disabled={isPending}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                currency: event.target.value.toUpperCase(),
              }))
            }
            placeholder="USD"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save consultation offer"}
      </Button>
    </form>
  );
}
