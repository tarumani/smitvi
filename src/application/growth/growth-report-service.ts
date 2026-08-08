import type { GrowthDailyBrief } from "@/domain/growth/types";
import { prisma } from "@/infrastructure/database/prisma";

export class GrowthAnalyticsService {
  async getFunnel(days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const statuses = await prisma.growthProspect.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { createdAt: { gte: since } },
    });

    const conversions = await prisma.growthConversion.count({
      where: { activatedAt: { not: null } },
    });

    const revenue = await prisma.growthConversion.aggregate({
      _sum: { revenueCents: true },
    });

    return {
      byStatus: statuses.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      activatedCreators: conversions,
      attributedRevenueCents: revenue._sum.revenueCents ?? 0,
    };
  }

  async getChannelAttribution() {
    const rows = await prisma.growthProspect.groupBy({
      by: ["acquisitionSource"],
      _count: { id: true },
      where: { acquisitionSource: { not: null } },
    });
    return rows.map((r) => ({
      source: r.acquisitionSource ?? "unknown",
      count: r._count.id,
    }));
  }
}

export class GrowthReportService {
  async buildDailyBrief(): Promise<GrowthDailyBrief> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      discoveredToday,
      qualified,
      pendingReview,
      registered,
      activated,
      topOpp,
    ] = await Promise.all([
      prisma.growthProspect.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.growthProspect.count({ where: { status: "QUALIFIED" } }),
      prisma.growthMessage.count({
        where: { approvalStatus: "PENDING_REVIEW" },
      }),
      prisma.growthProspect.count({ where: { status: "REGISTERED" } }),
      prisma.growthProspect.count({ where: { status: "ACTIVATED" } }),
      prisma.growthOpportunity.findFirst({
        orderBy: { opportunityScore: "desc" },
      }),
    ]);

    const brief: GrowthDailyBrief = {
      date: todayStart.toISOString().slice(0, 10),
      prospectsDiscovered: discoveredToday,
      qualified,
      pendingReview,
      registered,
      activated,
      topOpportunity: topOpp?.title ?? null,
      recommendedAction:
        pendingReview > 0
          ? "Review pending outreach drafts before sending."
          : "Run opportunity analysis and import high-fit prospects.",
    };

    await prisma.growthReport.create({
      data: { kind: "daily", payload: brief },
    });

    return brief;
  }

  async buildWeeklyReport() {
    const funnel = await new GrowthAnalyticsService().getFunnel(7);
    const channels = await new GrowthAnalyticsService().getChannelAttribution();
    const payload = {
      weekEnding: new Date().toISOString().slice(0, 10),
      funnel,
      channels,
      recommendedExperiment: "Test designer-specific value proposition on email",
    };
    await prisma.growthReport.create({
      data: { kind: "weekly", payload },
    });
    return payload;
  }
}
