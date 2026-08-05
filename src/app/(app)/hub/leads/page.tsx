import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Leads",
};

export default async function HubLeadsPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const userId = session.user.id;
  const [inbox, consults, orders] = await Promise.all([
    container.conversations.listInboxForOwner(userId),
    container.consultations.listRequestsForExpert(userId),
    container.marketplace.listRecentSellerOrders(userId, 20),
  ]);

  type LeadRow = {
    id: string;
    kind: "twin" | "consultation" | "order";
    title: string;
    subtitle: string;
    href: string;
    createdAt: Date;
  };

  const leads: LeadRow[] = [
    ...inbox.map((thread) => ({
      id: thread.id,
      kind: "twin" as const,
      title: thread.visitor.displayName ?? thread.visitor.email,
      subtitle: thread.lastMessage?.content?.slice(0, 120) ?? "Twin inbox thread",
      href: ROUTES.inboxConversation(thread.id),
      createdAt: thread.updatedAt,
    })),
    ...consults.map((request) => ({
      id: request.id,
      kind: "consultation" as const,
      title: request.requesterName,
      subtitle: request.message ?? request.status,
      href: ROUTES.consultationSettings,
      createdAt: request.createdAt,
    })),
    ...orders.map((order) => ({
      id: order.id,
      kind: "order" as const,
      title: order.listing.title,
      subtitle: `@${order.buyer.profile?.username ?? order.buyer.profile?.displayName ?? "buyer"} · ${order.status}`,
      href: ROUTES.marketplaceOrders,
      createdAt: order.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Leads & inbox
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Twin conversations, consultation requests, and marketplace orders in one
          place.
        </p>
      </div>

      {leads.length === 0 ? (
        <GlassCard className="p-6 text-sm text-[var(--muted-foreground)]">
          No leads yet — publish your Twin and offers to start earning.
        </GlassCard>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li key={`${lead.kind}-${lead.id}`}>
              <Link href={lead.href}>
                <GlassCard className="p-4 transition-colors hover:bg-[var(--surface-elevated)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                        {lead.kind === "twin"
                          ? "Twin chat"
                          : lead.kind === "consultation"
                            ? "Consultation"
                            : "Marketplace"}
                      </p>
                      <p className="mt-1 font-semibold">{lead.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                        {lead.subtitle}
                      </p>
                    </div>
                    <time
                      dateTime={lead.createdAt.toISOString()}
                      className="shrink-0 text-xs text-[var(--muted)]"
                    >
                      {lead.createdAt.toLocaleDateString()}
                    </time>
                  </div>
                </GlassCard>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
