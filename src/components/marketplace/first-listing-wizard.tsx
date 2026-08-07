"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  FIRST_LISTING_TEMPLATES,
  suggestFirstListing,
  type FirstListingDraft,
  type ListingTemplateId,
} from "@/config/marketplace-listing-templates";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

type ProfileHints = {
  displayName: string;
  profession: string | null;
  headline: string | null;
  bio: string | null;
};

type Props = {
  profile: ProfileHints;
  initialTemplateId: ListingTemplateId;
};

export function FirstListingWizard({ profile, initialTemplateId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [templateId, setTemplateId] = useState<ListingTemplateId>(initialTemplateId);
  const [isPending, startTransition] = useTransition();

  const draft = useMemo(
    () => suggestFirstListing(templateId, profile),
    [templateId, profile],
  );

  const [form, setForm] = useState<FirstListingDraft>(draft);

  function selectTemplate(id: ListingTemplateId) {
    setTemplateId(id);
    setForm(suggestFirstListing(id, profile));
    setStep(2);
  }

  function publish(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const priceCents = Math.round(Number(form.priceUsd) * 100);
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
              : "Could not publish listing";
          throw new Error(message);
        }
        toast.success("Your first offer is live on the marketplace");
        setStep(3);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not publish listing",
        );
      }
    });
  }

  if (step === 3) {
    return (
      <GlassCard className="border-[var(--accent)]/30 bg-[var(--accent-soft)]/15 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--accent)]" />
        <h2 className="mt-4 font-display text-2xl font-bold">Offer published</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Buyers can find it on the marketplace and on your hub Offers tab.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={ROUTES.marketplace}>View marketplace</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={ROUTES.hub.marketplace}>Manage listings</Link>
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
        <span className={step === 1 ? "text-[var(--accent)]" : ""}>1. Template</span>
        <span aria-hidden>→</span>
        <span className={step === 2 ? "text-[var(--accent)]" : ""}>2. Details</span>
        <span aria-hidden>→</span>
        <span>3. Live</span>
      </div>

      {step === 1 ? (
        <>
          <p className="text-sm text-[var(--muted-foreground)]">
            Pick a starter offer — we prefilled copy from your profile. You can
            edit everything before publishing.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {FIRST_LISTING_TEMPLATES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTemplate(item.id)}
                className={cn(
                  "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition-colors hover:border-[var(--accent)]",
                  templateId === item.id && "border-[var(--accent)] ring-1 ring-[var(--accent)]/30",
                )}
              >
                <p className="font-semibold">{item.label}</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {item.summary}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                  Use template
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <form onSubmit={publish} className="space-y-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
            onClick={() => setStep(1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Change template
          </Button>
          <div className="space-y-2">
            <Label htmlFor="wizard-title">Title</Label>
            <Input
              id="wizard-title"
              required
              value={form.title}
              onChange={(e) =>
                setForm((c) => ({ ...c, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-description">Description</Label>
            <Textarea
              id="wizard-description"
              required
              className="min-h-[120px]"
              value={form.description}
              onChange={(e) =>
                setForm((c) => ({ ...c, description: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wizard-price">Price (USD)</Label>
              <Input
                id="wizard-price"
                type="number"
                min="1"
                required
                value={form.priceUsd}
                onChange={(e) =>
                  setForm((c) => ({ ...c, priceUsd: e.target.value }))
                }
              />
            </div>
            {form.type === "CONSULTATION" ? (
              <div className="space-y-2">
                <Label htmlFor="wizard-duration">Duration (minutes)</Label>
                <Input
                  id="wizard-duration"
                  type="number"
                  min="15"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      durationMinutes: e.target.value,
                    }))
                  }
                />
              </div>
            ) : null}
          </div>
          <p className="text-xs text-[var(--muted)]">
            Published as ACTIVE — visible on the public marketplace immediately.
          </p>
          <Button type="submit" disabled={isPending} size="lg">
            {isPending ? "Publishing…" : "Publish my first offer"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
