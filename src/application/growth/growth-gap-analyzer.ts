import { prisma } from "@/infrastructure/database/prisma";
import { SearchAnalyticsService } from "@/application/search/search-analytics-service";
export type GapOpportunity = {
  title: string;
  category: string;
  opportunityScore: number;
  demandSignal: string;
  supplySignal: string;
  rationale: string;
};

export class GrowthGapAnalyzer {
  constructor(
    private readonly searchAnalytics = new SearchAnalyticsService(),
  ) {}

  async analyze(days = 30): Promise<GapOpportunity[]> {
    const summary = await this.searchAnalytics.getAdminSummary(days);
    const opportunities: GapOpportunity[] = [];

    for (const row of summary.topQueries.slice(0, 15)) {
      const query = row.query;
      const demand = row.count;
      const avgResults = await prisma.searchEvent.aggregate({
        where: {
          queryNormalized: query,
          intent: { not: "SUCCESS" },
        },
        _avg: { resultCount: true },
      });
      const avg = avgResults._avg.resultCount ?? 0;
      if (demand < 3) continue;

      const supplyLow = avg < 5;
      if (!supplyLow && demand < 10) continue;

      const opportunityScore = clamp(
        Math.round(
          Math.min(100, demand * 2) * (supplyLow ? 1.2 : 0.7) +
            (avg < 2 ? 20 : 0),
        ),
      );

      opportunities.push({
        title: query.slice(0, 160),
        category: "search_demand",
        opportunityScore,
        demandSignal: `${demand} searches (last ${days}d)`,
        supplySignal: `~${avg.toFixed(1)} avg results per search`,
        rationale: supplyLow
          ? "High search demand with low result supply"
          : "Popular query — verify expert coverage",
      });
    }

    const skillCounts = await prisma.graphEntity.groupBy({
      by: ["canonicalName"],
      where: { entityType: "SKILL", ownerUserId: null },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 50,
    });

    const underrepresented = skillCounts.filter((s) => s._count.id <= 3);
    for (const skill of underrepresented.slice(0, 10)) {
      opportunities.push({
        title: skill.canonicalName,
        category: "graph_skill_gap",
        opportunityScore: clamp(88 - skill._count.id * 8),
        demandSignal: "Network coverage signal",
        supplySignal: `${skill._count.id} linked creators in graph`,
        rationale: "Underrepresented skill in the Human Intelligence Graph",
      });
    }

    return opportunities
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 25);
  }

  async persistOpportunities(days = 30): Promise<number> {
    const items = await this.analyze(days);
    await prisma.growthOpportunity.deleteMany({
      where: { computedAt: { lt: new Date(Date.now() - days * 86400000) } },
    });
    if (items.length === 0) return 0;
    await prisma.growthOpportunity.createMany({
      data: items.map((o) => ({
        title: o.title,
        category: o.category,
        opportunityScore: o.opportunityScore,
        demandSignal: o.demandSignal,
        supplySignal: o.supplySignal,
        rationale: o.rationale,
      })),
    });
    return items.length;
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
