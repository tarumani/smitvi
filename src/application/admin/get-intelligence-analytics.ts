import { prisma } from "@/infrastructure/database/prisma";
import { startOfWeek } from "@/application/intelligence/next-best-action-service";

export class GetIntelligenceAnalytics {
  async execute() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86400000);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const [
      dau,
      wau,
      mau,
      meaningfulWeek,
      avgReady,
      completed,
      dismissed,
      inactive,
      twinWeek,
      knowledgeWeek,
      projectsWeek,
      reports,
    ] = await Promise.all([
      prisma.profile.count({
        where: { lastMeaningfulActivityAt: { gte: dayAgo } },
      }),
      prisma.profile.count({
        where: { lastMeaningfulActivityAt: { gte: weekAgo } },
      }),
      prisma.profile.count({
        where: { lastMeaningfulActivityAt: { gte: monthAgo } },
      }),
      prisma.meaningfulActivity.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.profile.aggregate({
        _avg: { intelligenceReadinessScore: true },
      }),
      prisma.nextBestAction.groupBy({
        by: ["type"],
        where: { status: "COMPLETED" },
        _count: { _all: true },
      }),
      prisma.nextBestAction.groupBy({
        by: ["type"],
        where: { status: "DISMISSED" },
        _count: { _all: true },
      }),
      prisma.profile.count({
        where: {
          OR: [
            { lastMeaningfulActivityAt: null },
            { lastMeaningfulActivityAt: { lt: monthAgo } },
          ],
        },
      }),
      prisma.twinQueryEvent.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.knowledgeSource.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.portfolioItem.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.weeklyIntelligenceReport.findMany({
        where: { weekStart: startOfWeek(now) },
        select: { metricsSnapshot: true },
        take: 500,
      }),
    ]);

    const generated = await prisma.nextBestAction.count();
    const completedCount = await prisma.nextBestAction.count({
      where: { status: "COMPLETED" },
    });

    const weekDeltas = reports
      .map((r) => {
        const m = r.metricsSnapshot as { delta?: number };
        return typeof m.delta === "number" ? m.delta : 0;
      });
    const avgWeeklyImprovement =
      weekDeltas.length === 0
        ? 0
        : Math.round(
            (weekDeltas.reduce((a, b) => a + b, 0) / weekDeltas.length) * 10,
          ) / 10;

    const funnel = {
      registered: await prisma.user.count({ where: { deletedAt: null } }),
      activated: await prisma.profile.count({
        where: {
          activationStatus: {
            in: [
              "PROFILE_ACTIVATED",
              "INTELLIGENCE_READY",
              "DISCOVERABLE",
              "MONETIZABLE",
            ],
          },
        },
      }),
      weeklyActive: wau,
      meaningfulAction: meaningfulWeek,
      intelligenceReady: await prisma.profile.count({
        where: {
          activationStatus: {
            in: ["INTELLIGENCE_READY", "DISCOVERABLE", "MONETIZABLE"],
          },
        },
      }),
      discoverable: await prisma.profile.count({
        where: { appearInExpertDiscovery: true, visibility: "PUBLIC" },
      }),
      monetizationEnabled: await prisma.profile.count({
        where: { activationStatus: "MONETIZABLE" },
      }),
    };

    return {
      dau,
      wau,
      mau,
      meaningfulActionsThisWeek: meaningfulWeek,
      averageIntelligenceReadiness:
        Math.round((avgReady._avg.intelligenceReadinessScore ?? 0) * 10) / 10,
      averageWeeklyImprovement: avgWeeklyImprovement,
      nextBestActionCompletionRate:
        generated === 0 ? 0 : Math.round((completedCount / generated) * 1000) / 10,
      mostCompleted: completed.map((r) => ({
        type: r.type,
        count: r._count._all,
      })),
      mostDismissed: dismissed.map((r) => ({
        type: r.type,
        count: r._count._all,
      })),
      inactiveUsers: inactive,
      twinActivityThisWeek: twinWeek,
      knowledgeCreatedThisWeek: knowledgeWeek,
      projectsAddedThisWeek: projectsWeek,
      funnel,
    };
  }
}
