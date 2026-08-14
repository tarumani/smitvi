import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

type Props = {
  score: number;
  activated: boolean;
};

export function ImproveIntelligenceBanner({ score, activated }: Props) {
  if (score >= 61 && activated) return null;

  return (
    <GlassCard className="border-[var(--accent)]/20 p-5">
      <h3 className="font-display text-lg font-semibold">
        Improve your Intelligence Profile
      </h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Your profile has limited information, which may affect expert discovery,
        AI Twin quality, recommendations, and opportunities.
      </p>
      <p className="mt-2 text-sm">
        Let Smitvi AI improve your profile in about 2 minutes.
      </p>
      <Button asChild className="mt-4" size="sm">
        <Link href={ROUTES.onboardingImprove}>Improve with AI</Link>
      </Button>
    </GlassCard>
  );
}
