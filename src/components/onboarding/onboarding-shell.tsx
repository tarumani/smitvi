"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SmitviLogo } from "@/components/brand/smitvi-logo";
import {
  onboardingProgressPercent,
  type OnboardingFlowStep,
} from "@/config/onboarding-flow";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

type OnboardingShellProps = {
  step: OnboardingFlowStep;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function OnboardingShell({
  step,
  title,
  subtitle,
  children,
  footer,
}: OnboardingShellProps) {
  const progress = onboardingProgressPercent(step);

  return (
    <div className="relative min-h-svh overflow-hidden bg-[var(--background)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--accent-soft),transparent)]"
      />
      <div className="relative mx-auto flex min-h-svh w-full max-w-lg flex-col px-4 py-8 sm:max-w-xl sm:px-6">
        <header className="mb-8 flex items-center justify-between gap-4">
          <SmitviLogo href={ROUTES.home} size="sm" />
          <span className="text-xs font-medium tabular-nums text-[var(--muted)]">
            {progress}%
          </span>
        </header>

        <div className="mb-6">
          <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
            <motion.div
              className="h-full rounded-full bg-[var(--accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(progress, 4)}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex-1"
        >
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              "rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)]/70 p-5 shadow-sm backdrop-blur-xl sm:p-8",
            )}
          >
            {children}
          </div>
        </motion.div>

        {footer ? <footer className="mt-6 pb-4">{footer}</footer> : null}
      </div>
    </div>
  );
}

export function OnboardingContinueLink({
  href,
  label = "Continue",
  disabled,
}: {
  href: string;
  label?: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--muted)]/30 px-6 py-3 text-sm font-semibold text-[var(--muted)]">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-95"
    >
      {label}
    </Link>
  );
}
