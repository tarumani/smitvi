import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES, TRAIN_TWIN_LABEL } from "@/config/constants";

type Props = {
  username: string;
  knowledgeCount: number;
  twinReady: boolean;
  consultationsEnabled: boolean;
  listingCount: number;
};

export function TwinLaunchChecklist({
  username,
  knowledgeCount,
  twinReady,
  consultationsEnabled,
  listingCount,
}: Props) {
  const profileDone = true;
  const hasKnowledge = knowledgeCount > 0;
  const canMonetize = twinReady;

  const steps = [
    {
      id: "profile",
      label: "Profile activated",
      done: profileDone,
      href: ROUTES.publicProfile(username),
      action: "View hub",
    },
    {
      id: "knowledge",
      label: "Upload at least one knowledge source",
      done: hasKnowledge,
      href: ROUTES.hub.intelligence,
      action: TRAIN_TWIN_LABEL,
    },
    {
      id: "twin",
      label: "Twin live (source processed)",
      done: twinReady,
      href: ROUTES.hub.intelligence,
      action: twinReady ? "Add more" : "Finish training",
    },
    {
      id: "book",
      label: "Enable Book tab (consultations)",
      done: consultationsEnabled,
      href: consultationsEnabled
        ? ROUTES.consultationSettings
        : ROUTES.consultationSetup,
      action: consultationsEnabled ? "Manage booking" : "Enable booking",
    },
    {
      id: "monetize",
      label: "Publish a marketplace offer",
      done: listingCount > 0,
      href:
        listingCount > 0 ? ROUTES.hub.marketplace : ROUTES.marketplaceSellFirst,
      action: listingCount > 0 ? "Manage listings" : "Create listing",
    },
  ] as const;

  const completed = steps.filter((s) => s.done).length;
  const allCoreDone =
    profileDone && hasKnowledge && twinReady && consultationsEnabled;

  if (allCoreDone && listingCount > 0) {
    return null;
  }

  return (
    <GlassCard className="border-[var(--accent)]/30 p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">
            Path to revenue
          </p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
            Launch checklist
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {completed} of {steps.length} complete — genuine visitors and buyers
            need a trained Twin and real offers.
          </p>
        </div>
        {!canMonetize ? (
          <Button asChild className="shrink-0">
            <Link href={ROUTES.hub.intelligence}>{TRAIN_TWIN_LABEL}</Link>
          </Button>
        ) : listingCount === 0 ? (
          <Button asChild className="shrink-0">
            <Link href={ROUTES.marketplaceSellFirst}>Create first listing</Link>
          </Button>
        ) : !consultationsEnabled ? (
          <Button asChild className="shrink-0">
            <Link href={ROUTES.consultationSetup}>Enable Book tab</Link>
          </Button>
        ) : null}
      </div>

      <ol className="mt-6 space-y-3">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex flex-col gap-2 rounded-xl border border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--muted)]" />
              )}
              <p
                className={
                  step.done
                    ? "text-sm font-medium text-[var(--foreground)]"
                    : "text-sm text-[var(--muted-foreground)]"
                }
              >
                {step.label}
              </p>
            </div>
            {!step.done || step.id === "monetize" ? (
              <Link
                href={step.href}
                className="text-sm font-semibold text-[var(--accent)] hover:underline sm:shrink-0"
              >
                {step.action}
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}
