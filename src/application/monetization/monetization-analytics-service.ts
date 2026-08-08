import { prisma } from "@/infrastructure/database/prisma";
import type { PrismaMarketplaceRepository } from "@/infrastructure/database/repositories/marketplace-repository";

export class MonetizationAnalyticsService {
  constructor(private readonly marketplace: PrismaMarketplaceRepository) {}

  async getCreatorDashboard(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const lastMonthStart = new Date(startOfMonth);
    lastMonthStart.setUTCMonth(lastMonthStart.getUTCMonth() - 1);

    const [
      wallet,
      lifetimeNet,
      thisMonthNet,
      lastMonthNet,
      pendingOrders,
      listings,
    ] = await Promise.all([
      prisma.creatorWallet.findUnique({ where: { userId } }),
      this.marketplace.sumSellerNetEarningsCents(userId),
      this.marketplace.sumSellerNetEarningsThisMonthCents(userId),
      prisma.marketplaceOrder.aggregate({
        where: {
          sellerId: userId,
          status: { in: ["PAID", "FULFILLED"] },
          paidAt: { gte: lastMonthStart, lt: startOfMonth },
        },
        _sum: { netAmountCents: true },
      }),
      prisma.marketplaceOrder.count({
        where: { sellerId: userId, status: "PENDING" },
      }),
      prisma.marketplaceListing.count({
        where: { sellerId: userId, status: "ACTIVE" },
      }),
    ]);

    return {
      wallet: wallet ?? {
        availableBalanceCents: 0,
        pendingBalanceCents: 0,
        lifetimeEarningsCents: lifetimeNet,
        currency: "USD",
        status: "ACTIVE",
      },
      revenue: {
        lifetimeCents: lifetimeNet,
        thisMonthCents: thisMonthNet,
        lastMonthCents: lastMonthNet._sum.netAmountCents ?? 0,
      },
      pendingOrders,
      activeListings: listings,
    };
  }

  async getDetailedAnalytics(userId: string) {
    const orders = await this.marketplace.listRecentSellerOrders(userId, 100);
    const byMonth = new Map<string, number>();
    for (const o of orders) {
      if (o.status !== "PAID" && o.status !== "FULFILLED") continue;
      const key = o.paidAt
        ? `${o.paidAt.getUTCFullYear()}-${o.paidAt.getUTCMonth() + 1}`
        : "unknown";
      byMonth.set(key, (byMonth.get(key) ?? 0) + o.netAmountCents);
    }

    const topProducts = await prisma.marketplaceListing.findMany({
      where: { sellerId: userId },
      orderBy: { salesCount: "desc" },
      take: 5,
      select: { id: true, title: true, salesCount: true, priceCents: true },
    });

    return {
      revenueByMonth: [...byMonth.entries()].map(([month, cents]) => ({
        month,
        cents,
      })),
      topProducts,
      orderCount: orders.filter(
        (o) => o.status === "PAID" || o.status === "FULFILLED",
      ).length,
    };
  }
}
