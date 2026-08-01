import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { getEntitlements } from "@/domain/billing/entitlements";
import { CreateOrgForm } from "@/components/organization/create-org-form";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "New workspace",
};

export default async function NewOrganizationPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  const entitlements = getEntitlements(session.user.plan);
  if (!entitlements.businessWorkspace) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Business required
        </h1>
        <GlassCard className="space-y-4 p-6">
          <p className="text-sm text-[var(--muted-foreground)]">
            Creating a company workspace is available on the Business plan.
          </p>
          <Button asChild>
            <Link href={ROUTES.pricing}>View pricing</Link>
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Create workspace
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Shared knowledge twin for your company — seats, roles, and private
          corpus.
        </p>
      </div>
      <GlassCard className="p-6">
        <CreateOrgForm />
      </GlassCard>
    </div>
  );
}
