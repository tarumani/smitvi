import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { ROUTES } from "@/config/constants";
import { MyIntelligenceGraphPreview } from "@/components/intelligence/my-intelligence-graph";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My Intelligence",
};

export default async function DashboardIntelligencePage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Intelligence Graph
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Your structured skills, projects, and relationships — separate from
            raw training files.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={ROUTES.hub.intelligence}>Train Twin</Link>
        </Button>
      </div>
      <MyIntelligenceGraphPreview />
    </div>
  );
}
