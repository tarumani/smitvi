import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/config/constants";
import type { LaunchStepId } from "@/components/dashboard/launch-wizard-steps";

type Props = {
  step?: LaunchStepId;
};

export function LaunchWizardReturnBanner({ step }: Props) {
  return (
    <Link
      href={ROUTES.launchDashboard(step)}
      className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)]/20 px-4 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]/40"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to launch wizard
    </Link>
  );
}
