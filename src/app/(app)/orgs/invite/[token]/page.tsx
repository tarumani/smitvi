import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { AcceptInviteButton } from "@/components/organization/accept-invite-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Accept invite",
};

export default async function AcceptOrgInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) {
    const { token } = await params;
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.organizationInvite(token))}`);
  }

  const { token } = await params;
  const invite = await container.organizations.findInviteByToken(token);

  if (!invite || invite.status !== "PENDING") {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="font-display text-3xl font-bold">Invite unavailable</h1>
        <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
          This invite is missing, expired, or already used.
        </GlassCard>
        <Button asChild variant="secondary">
          <Link href={ROUTES.organizations}>Back to workspaces</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Join {invite.organization.name}
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Invited as {invite.role.toLowerCase()} · {invite.email}
        </p>
      </div>
      <GlassCard className="space-y-4 p-6">
        <p className="text-sm text-[var(--muted-foreground)]">
          Signed in as {session.email}. Accept to join this company workspace.
        </p>
        <AcceptInviteButton token={token} />
      </GlassCard>
    </div>
  );
}
