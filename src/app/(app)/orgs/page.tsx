import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { getEntitlements } from "@/domain/billing/entitlements";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Workspaces",
};

export default async function OrganizationsPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  const memberships = await container.organizations.listForUser(session.user.id);
  const entitlements = getEntitlements(session.user.plan);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Workspaces
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Company knowledge twins for teams on the Business plan.
          </p>
        </div>
        {entitlements.businessWorkspace ? (
          <Button asChild>
            <Link href={ROUTES.organizationNew}>New workspace</Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link href={ROUTES.pricing}>Upgrade to Business</Link>
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {memberships.map(({ organization, role }) => (
          <GlassCard key={organization.id} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <Link
                    href={ROUTES.organization(organization.slug)}
                    className="font-display text-lg font-semibold hover:underline"
                  >
                    {organization.name}
                  </Link>
                  <p className="text-sm text-[var(--muted)]">
                    /{organization.slug} · {role}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={ROUTES.organization(organization.slug)}>Open</Link>
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>

      {memberships.length === 0 ? (
        <GlassCard className="p-6 text-sm text-[var(--muted-foreground)]">
          {entitlements.businessWorkspace
            ? "No workspaces yet. Create one to share company knowledge with your team."
            : "Workspaces require Business. You can still accept invites sent to your email."}
        </GlassCard>
      ) : null}
    </div>
  );
}
