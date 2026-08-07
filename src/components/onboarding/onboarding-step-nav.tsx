import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ClassicOnboardingStepId } from "@/components/onboarding/onboarding-classic-layout";
import { ROUTES } from "@/config/constants";

const PREVIOUS_HREF: Partial<Record<ClassicOnboardingStepId, string>> = {
  profile: ROUTES.onboardingArchetype,
  connect: ROUTES.onboardingProfile,
  build: ROUTES.onboardingConnect,
  celebrate: ROUTES.onboardingBuild,
};

const NEXT_HREF: Partial<Record<ClassicOnboardingStepId, string>> = {
  connect: ROUTES.onboardingBuild,
};

type Props = {
  step: ClassicOnboardingStepId;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextPending?: boolean;
  nextLabel?: string;
  /** Submit a form by id when Next is clicked */
  nextFormId?: string;
};

export function OnboardingStepNav({
  step,
  onNext,
  nextDisabled,
  nextPending,
  nextLabel = "Next",
  nextFormId,
}: Props) {
  const prevHref = PREVIOUS_HREF[step];
  const nextHref = NEXT_HREF[step];

  return (
    <div
      className={
        prevHref
          ? "flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4"
          : "flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] pt-4"
      }
    >
      {prevHref ? (
        <Button asChild variant="ghost" className="order-2 sm:order-1">
          <Link href={prevHref}>Previous</Link>
        </Button>
      ) : null}

      <div
        className={
          prevHref
            ? "order-1 flex w-full gap-2 sm:order-2 sm:ml-auto sm:w-auto"
            : "flex w-full gap-2 sm:w-auto"
        }
      >
        {onNext ? (
          <Button
            type="button"
            className="flex-1 sm:flex-none"
            disabled={nextDisabled || nextPending}
            onClick={onNext}
          >
            {nextPending ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-4 w-4 border-[var(--accent-foreground)] border-t-transparent" />
                Please wait…
              </span>
            ) : (
              nextLabel
            )}
          </Button>
        ) : nextFormId ? (
          <Button
            type="submit"
            form={nextFormId}
            className="flex-1 sm:flex-none"
            disabled={nextPending}
          >
            {nextPending ? "Saving…" : nextLabel}
          </Button>
        ) : nextHref ? (
          <Button asChild className="flex-1 sm:flex-none">
            <Link href={nextHref}>{nextLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
