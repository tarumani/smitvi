import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookOpen, MessageSquare, Users } from "lucide-react";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const organization = await container.organizations.findBySlug(slug);
  return { title: organization?.name ?? "Workspace" };
}

export default async function OrganizationHomePage({
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

  const [members, sources] = await Promise.all([
    container.organizations.listMembers(organization.id),
    container.knowledge.listByOrganization(organization.id),
  ]);

  const links = [
    {
      href: ROUTES.organizationKnowledge(slug),
      label: "Knowledge",
      description: `${sources.length} sources in this workspace`,
      icon: BookOpen,
    },
    {
      href: ROUTES.organizationChat(slug),
      label: "Workspace Twin",
      description: "Chat against shared company knowledge",
      icon: MessageSquare,
    },
    {
      href: ROUTES.organizationMembers(slug),
      label: "Members",
      description: `${members.length} / ${organization.seatLimit} seats`,
      icon: Users,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
          Workspace · {membership.role}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          {organization.name}
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          {organization.description ??
            "Shared intelligence for your company team."}
        </p>
      </div>

      <div className="grid gap-3">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <GlassCard key={item.href} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={item.href}>Open</Link>
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
