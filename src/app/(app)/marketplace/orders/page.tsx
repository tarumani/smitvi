import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { EmailContactButton } from "@/components/marketplace/email-contact-button";
import { ROUTES } from "@/config/constants";
import { prisma } from "@/infrastructure/database/prisma";

export const metadata: Metadata = {
  title: "Marketplace orders",
};

function counterpartyLabel(
  profile: { username: string; displayName: string } | null | undefined,
  fallback: string,
) {
  if (!profile) return fallback;
  return profile.displayName?.trim() || `@${profile.username}`;
}

export default async function MarketplaceOrdersPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  const orders = await container.marketplace.listOrdersForUser(session.user.id);

  const emailsByUserId = new Map<string, string>();
  if (orders.length > 0) {
    const ids = new Set<string>();
    for (const order of orders) {
      if (order.sellerId === session.user.id) ids.add(order.buyerId);
      if (order.buyerId === session.user.id) ids.add(order.sellerId);
    }
    const users = await prisma.user.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true, email: true },
    });
    for (const u of users) emailsByUserId.set(u.id, u.email);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Orders
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Purchases and sales across the expert marketplace. For sold items, use
          the buyer details below to follow up after payment completes.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href={ROUTES.hub.leads}
            className="font-medium text-[var(--accent)] hover:underline"
          >
            Hub → Leads
          </Link>{" "}
          also lists marketplace buyers alongside Twin chats and consultation
          requests.
        </p>
      </div>

      {orders.length === 0 ? (
        <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
          No orders yet.
        </GlassCard>
      ) : (
        orders.map((order) => {
          const isBuyer = order.buyerId === session.user.id;
          const counterpartyId = isBuyer ? order.sellerId : order.buyerId;
          const counterpartyProfile = isBuyer
            ? order.seller.profile
            : order.buyer.profile;
          const counterpartyEmail = emailsByUserId.get(counterpartyId);
          const roleLabel = isBuyer ? "Seller" : "Buyer";
          const username = counterpartyProfile?.username;

          return (
            <GlassCard key={order.id} id={`order-${order.id}`} className="scroll-mt-24 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{order.listing.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {isBuyer ? "Purchased" : "Sold"} · {order.status}
                    {order.status === "PENDING"
                      ? " · awaiting payment confirmation"
                      : null}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Gross ${(order.grossAmountCents / 100).toFixed(2)} · Fee $
                    {(order.commissionCents / 100).toFixed(2)} · Net $
                    {(order.netAmountCents / 100).toFixed(2)}
                  </p>

                  <div className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/50 p-3">
                    <Avatar
                      src={counterpartyProfile?.avatarUrl}
                      name={counterpartyLabel(counterpartyProfile, roleLabel)}
                      className="h-10 w-10 shrink-0"
                    />
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-[var(--muted)]">
                        {roleLabel}
                      </p>
                      <p className="font-semibold">
                        {counterpartyLabel(counterpartyProfile, "Unknown user")}
                        {username ? (
                          <span className="font-normal text-[var(--muted-foreground)]">
                            {" "}
                            · @{username}
                          </span>
                        ) : null}
                      </p>
                      {counterpartyEmail ? (
                        <p className="mt-1 text-[var(--muted-foreground)]">
                          {counterpartyEmail}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {username ? (
                    <Button asChild variant="secondary" size="sm">
                      <Link href={ROUTES.publicProfile(username)}>
                        View profile
                      </Link>
                    </Button>
                  ) : null}
                  {counterpartyEmail ? (
                    <EmailContactButton
                      email={counterpartyEmail}
                      subject={
                        isBuyer
                          ? `Question about: ${order.listing.title}`
                          : `Your order: ${order.listing.title}`
                      }
                      label={isBuyer ? "Email seller" : "Email buyer"}
                      variant={isBuyer ? "secondary" : "default"}
                    />
                  ) : username ? (
                    <Button asChild variant="secondary" size="sm">
                      <Link
                        href={`${ROUTES.publicProfile(username)}/chat`}
                      >
                        Message on Smitvi
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>

              {!isBuyer && order.status === "PENDING" ? (
                <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                  Payment is still pending. Once Razorpay confirms payment, status
                  becomes PAID and the buyer gets library access. You can still
                  email them to coordinate delivery.
                </p>
              ) : null}
            </GlassCard>
          );
        })
      )}
    </div>
  );
}
