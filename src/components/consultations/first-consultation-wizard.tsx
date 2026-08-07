"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  CONSULTATION_QUICK_PLANS,
  defaultConsultationPlan,
  suggestConsultationOffer,
  type ConsultationOfferDraft,
} from "@/config/consultation-offer-templates";
import { Button } from "@/components/ui/button";
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
  publicProfilePath: string;
};

export function FirstConsultationWizard({
  profile,
  publicProfilePath,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [planId, setPlanId] = useState(defaultConsultationPlan());
  const [isPending, startTransition] = useTransition();

  const suggested = useMemo(
    () => suggestConsultationOffer(planId, profile),
    [planId, profile],
  );

  const [form, setForm] = useState<ConsultationOfferDraft>(suggested);

  function pickPlan(id: (typeof CONSULTATION_QUICK_PLANS)[number]["id"]) {
    setPlanId(id);
    setForm(suggestConsultationOffer(id, profile));
    setStep(2);
  }

  function enableBooking(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const priceCents = Math.round(Number(form.priceUsd) * 100);
        const response = await fetch("/api/v1/consultations/offer", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: true,
            headline: form.headline,
            description: form.description,
            durationMinutes: form.durationMinutes,
            priceCents,
            currency: form.currency,
          }),
        });
        const json = (await response.json()) as { error?: { message?: string } };
        if (!response.ok) {
          throw new Error(json.error?.message ?? "Could not enable booking");
        }
        toast.success("Book tab is live on your public hub");
        setStep(3);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not enable booking",
        );
      }
    });
  }

  if (step === 3) {
    return (
      <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)]/15 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--accent)]" />
        <h2 className="mt-4 font-display text-2xl font-bold">Booking enabled</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Visitors can request time on your hub&apos;s Book tab.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={`${publicProfilePath}#hub-tab-book`}>Preview Book tab</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`${ROUTES.consultationSettings}#consultation-offer-form`}>
              Edit offer
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={ROUTES.hub.leads}>View leads</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-6 border-b border-[var(--border)] pb-8">
      <div>
        <p className="text-sm font-medium text-[var(--accent)]">Book tab setup</p>
        <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
          Enable consultations on your hub
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Turn on the Book tab so visitors can request paid or free sessions — a
          direct path to revenue alongside marketplace offers.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
        <span className={step === 1 ? "text-[var(--accent)]" : ""}>1. Plan</span>
        <span aria-hidden>→</span>
        <span className={step === 2 ? "text-[var(--accent)]" : ""}>2. Details</span>
        <span aria-hidden>→</span>
        <span>3. Live</span>
      </div>

      {step === 1 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {CONSULTATION_QUICK_PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => pickPlan(plan.id)}
              className={cn(
                "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition-colors hover:border-[var(--accent)]",
                planId === plan.id && "border-[var(--accent)]",
              )}
            >
              <p className="font-semibold">{plan.label}</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {plan.summary}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                Use plan
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <form onSubmit={enableBooking} className="space-y-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => setStep(1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Change plan
          </Button>
          <div className="space-y-2">
            <Label htmlFor="consult-headline">Headline</Label>
            <Input
              id="consult-headline"
              required
              value={form.headline}
              onChange={(e) =>
                setForm((c) => ({ ...c, headline: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consult-description">Description</Label>
            <Textarea
              id="consult-description"
              required
              className="min-h-[100px]"
              value={form.description}
              onChange={(e) =>
                setForm((c) => ({ ...c, description: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="consult-duration">Duration (minutes)</Label>
              <Input
                id="consult-duration"
                type="number"
                min={15}
                max={240}
                required
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    durationMinutes: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consult-price">Price (USD)</Label>
              <Input
                id="consult-price"
                type="number"
                min={0}
                required
                value={form.priceUsd}
                onChange={(e) =>
                  setForm((c) => ({ ...c, priceUsd: e.target.value }))
                }
              />
              <p className="text-xs text-[var(--muted)]">Use 0 for a free intro call.</p>
            </div>
          </div>
          <Button type="submit" disabled={isPending} size="lg">
            {isPending ? "Enabling…" : "Enable Book tab on my hub"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
