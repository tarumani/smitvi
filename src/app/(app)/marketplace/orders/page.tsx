import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Marketplace orders",
};

export default async function MarketplaceOrdersPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  const orders = await container.marketplace.listOrdersForUser(session.user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Orders
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Purchases and sales across the expert marketplace.
        </p>
      </div>

      {orders.length === 0 ? (
        <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
          No orders yet.
        </GlassCard>
      ) : (
        orders.map((order) => {
          const isBuyer = order.buyerId === session.user.id;
          return (
            <GlassCard key={order.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{order.listing.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {isBuyer ? "Purchased" : "Sold"} · {order.status}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Gross ${(order.grossAmountCents / 100).toFixed(2)} · Fee $
                    {(order.commissionCents / 100).toFixed(2)} · Net $
                    {(order.netAmountCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </GlassCard>
          );
        })
      )}
    </div>
  );
}
