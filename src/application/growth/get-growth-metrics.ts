import { prisma } from "@/infrastructure/database/prisma";
import { PrismaSearchRepository } from "@/infrastructure/database/repositories/search-repository";

export type GrowthMetrics = {
  totalUsers: number;
  onboardedProfiles: number;
  profilesWithKnowledge: number;
  twinsReady: number;
  qualifiedPublicHubs: number;
  activeMarketplaceListings: number;
  paidMarketplaceOrders: number;
  marketplaceNetRevenueCents: number;
  onboardingStepCounts: Array<{ step: string; count: number }>;
};

export class GetGrowthMetrics {
  async execute(): Promise<GrowthMetrics> {
    const [
      totalUsers,
      onboardedProfiles,
      profilesWithKnowledge,
      twinsReady,
      qualifiedPublicHubs,
      activeMarketplaceListings,
      paidMarketplaceOrders,
      revenueAgg,
      stepGroups,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.profile.count({ where: { isOnboarded: true } }),
      prisma.user.count({
        where: { deletedAt: null, knowledgeSources: { some: {} } },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          knowledgeSources: { some: { status: "READY" } },
        },
      }),
      new PrismaSearchRepository().countQualifiedPublicHubs(),
      prisma.marketplaceListing.count({ where: { status: "ACTIVE" } }),
      prisma.marketplaceOrder.count({
        where: { status: { in: ["PAID", "FULFILLED"] } },
      }),
      prisma.marketplaceOrder.aggregate({
        where: { status: { in: ["PAID", "FULFILLED"] } },
        _sum: { netAmountCents: true },
      }),
      prisma.profile.groupBy({
        by: ["onboardingStep"],
        _count: { _all: true },
        where: { isOnboarded: false },
      }),
    ]);

    const onboardingStepCounts = stepGroups
      .map((row) => ({
        step: row.onboardingStep?.trim() || "unknown",
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalUsers,
      onboardedProfiles,
      profilesWithKnowledge,
      twinsReady,
      qualifiedPublicHubs,
      activeMarketplaceListings,
      paidMarketplaceOrders,
      marketplaceNetRevenueCents: revenueAgg._sum.netAmountCents ?? 0,
      onboardingStepCounts,
    };
  }
}
