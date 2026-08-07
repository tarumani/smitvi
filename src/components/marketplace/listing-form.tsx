"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarketplacePayoutExplainer } from "@/components/marketplace/marketplace-payout-explainer";

const LISTING_TYPES = [
  {
    value: "CONSULTATION",
    label: "Consultation",
    hint: "Timed 1:1 call — design review, mentoring, feedback",
  },
  {
    value: "SERVICE_PACKAGE",
    label: "Service package",
    hint: "Fixed-scope work — branding, UI design, website redesign",
  },
  {
    value: "KNOWLEDGE_PACK",
    label: "Knowledge pack",
    hint: "Downloadable assets — Figma kit, templates, guides",
  },
  {
    value: "EXPERT_SUBSCRIPTION",
    label: "Expert subscription",
    hint: "Monthly ongoing access or retainership",
  },
  {
    value: "TEMPLATE",
    label: "Template",
    hint: "Reusable design or code templates",
  },
  {
    value: "PROMPT_PACK",
    label: "Prompt pack",
    hint: "Curated prompts for AI workflows",
  },
] as const;

type ListingTypeValue = (typeof LISTING_TYPES)[number]["value"];

export function ListingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    type: "CONSULTATION" as ListingTypeValue,
    title: "",
    description: "",
    price: "50",
    durationMinutes: "30",
  });

  const selectedType =
    LISTING_TYPES.find((item) => item.value === form.type) ?? LISTING_TYPES[0];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const priceCents = Math.round(Number(form.price) * 100);
        const response = await fetch("/api/v1/marketplace/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: form.type,
            title: form.title,
            description: form.description,
            currency: "USD",
            priceCents,
            durationMinutes:
              form.type === "CONSULTATION"
                ? Number(form.durationMinutes)
                : null,
          }),
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
              : "Could not create listing";
          throw new Error(message);
        }
        toast.success("Listing published");
        router.refresh();
        setForm({
          type: "CONSULTATION",
          title: "",
          description: "",
          price: "50",
          durationMinutes: "30",
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not create listing",
        );
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
          value={form.type}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              type: event.target.value as ListingTypeValue,
            }))
          }
        >
          {LISTING_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--muted)]">{selectedType.hint}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          placeholder="e.g. UI/UX designing services, brand identity package"
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
        />
        <p className="text-xs text-[var(--muted)]">
          This is where your specialty goes — design, development, coaching, and
          so on.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          required
          placeholder="What buyers get, what’s included, and who it’s for."
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            type="number"
            min="1"
            step="1"
            required
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({ ...current, price: event.target.value }))
            }
          />
        </div>
        {form.type === "CONSULTATION" ? (
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              value={form.durationMinutes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  durationMinutes: event.target.value,
                }))
              }
            />
          </div>
        ) : null}
      </div>
      <MarketplacePayoutExplainer
        examplePriceUsd={Math.max(1, Number(form.price) || 50)}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Publishing…" : "Publish listing"}
      </Button>
    </form>
  );
}
