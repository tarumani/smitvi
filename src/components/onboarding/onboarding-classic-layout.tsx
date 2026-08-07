import Link from "next/link";
import { SmitviLogo } from "@/components/brand/smitvi-logo";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "archetype", label: "Archetype" },
  { id: "profile", label: "Profile" },
  { id: "connect", label: "Connect" },
  { id: "build", label: "Build" },
  { id: "celebrate", label: "Launch" },
] as const;

export type ClassicOnboardingStepId = (typeof STEPS)[number]["id"];

type Props = {
  active: ClassicOnboardingStepId;
  children: React.ReactNode;
};

export function OnboardingClassicLayout({ active, children }: Props) {
  const activeIndex = STEPS.findIndex((s) => s.id === active);

  return (
    <div className="relative min-h-svh bg-[var(--background)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--accent-soft),transparent)]"
      />
      <div className="relative mx-auto w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-6">
        <header className="mb-4 flex items-center justify-between gap-4">
          <SmitviLogo href={ROUTES.home} size="sm" />
          <span className="text-xs font-medium tabular-nums text-[var(--muted)]">
            Step {activeIndex + 1} of {STEPS.length}
          </span>
        </header>

        <nav aria-label="Onboarding progress" className="mb-5">
          <ol className="flex gap-1">
            {STEPS.map((step, index) => {
              const done = index < activeIndex;
              const current = index === activeIndex;
              return (
                <li key={step.id} className="flex-1">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-colors",
                      done || current
                        ? "bg-[var(--accent)]"
                        : "bg-[var(--border)]",
                      current && "ring-2 ring-[var(--accent)]/30 ring-offset-2 ring-offset-[var(--background)]",
                    )}
                    title={step.label}
                  />
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-center text-xs font-medium text-[var(--muted-foreground)]">
            {STEPS[activeIndex]?.label}
          </p>
        </nav>

        <main className="pb-8">{children}</main>

        <footer className="border-t border-[var(--border)] py-3 text-center text-xs text-[var(--muted)]">
          Need help?{" "}
          <Link href={ROUTES.contact} className="text-[var(--accent)] hover:underline">
            Contact us
          </Link>
        </footer>
      </div>
    </div>
  );
}
