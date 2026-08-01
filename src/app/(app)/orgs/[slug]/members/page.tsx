import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { canManageMembers } from "@/domain/organization/entities";
import { InviteMemberForm } from "@/components/organization/invite-member-form";
import { Avatar } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Members",
};

export default async function OrganizationMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  const { slug } = await params;
  const organization = await container.organizations.findBySlug(slug);
  if (!organization) notFound();

  const membership = await container.organizations.getMembership(
    organization.id,
    session.user.id,
  );
  if (!membership) redirect(ROUTES.organizations);

  const [members, invites] = await Promise.all([
    container.organizations.listMembers(organization.id),
    container.organizations.listInvites(organization.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Members
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          {organization.name} · {members.length}/{organization.seatLimit} seats
        </p>
      </div>

      {canManageMembers(membership.role) ? (
        <GlassCard className="p-6">
          <h2 className="font-display text-lg font-semibold">Invite teammate</h2>
          <div className="mt-4">
            <InviteMemberForm slug={slug} />
          </div>
        </GlassCard>
      ) : null}

      <section className="space-y-3">
        {members.map((member) => (
          <GlassCard key={member.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={member.avatarUrl}
                  name={member.displayName ?? member.email ?? "Member"}
                />
                <div>
                  <p className="font-medium">
                    {member.displayName ?? member.email}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {member.email}
                    {member.username ? ` · @${member.username}` : ""}
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold tracking-wider text-[var(--accent)] uppercase">
                {member.role}
              </p>
            </div>
          </GlassCard>
        ))}
      </section>

      {invites.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Pending invites</h2>
          {invites.map((invite) => (
            <GlassCard
              key={invite.id}
              className="p-4 text-sm text-[var(--muted-foreground)]"
            >
              {invite.email} · {invite.role} · expires{" "}
              {invite.expiresAt.toLocaleDateString()}
            </GlassCard>
          ))}
        </section>
      ) : null}
    </div>
  );
}
