import type { ExplainableRecommendation } from "@/domain/recommendations/types";
import type { GraphService } from "@/application/graph/graph-service";
import { ExpertRankingService } from "@/application/search/expert-ranking-service";
import type { InterpretedEntity } from "@/domain/search/types";
import { prisma } from "@/infrastructure/database/prisma";

export class OpportunityService {
  constructor(
    private readonly graph: GraphService,
    private readonly ranking: ExpertRankingService,
  ) {}

  async matchForUser(userId: string): Promise<ExplainableRecommendation[]> {
    const g = await this.graph.getUserGraph(userId, userId);
    const entities: InterpretedEntity[] = [
      ...g.skills.map(({ entity }) => ({
        type: "SKILL" as const,
        value: entity.canonicalName,
        requirement: "OPTIONAL" as const,
        resolved: true,
        graphEntityId: entity.id,
      })),
      ...g.industries.map(({ entity }) => ({
        type: "INDUSTRY" as const,
        value: entity.canonicalName,
        requirement: "OPTIONAL" as const,
        resolved: true,
        graphEntityId: entity.id,
      })),
    ];

    const listings = await prisma.marketplaceListing.findMany({
      where: { status: "ACTIVE", sellerId: { not: userId } },
      take: 20,
      include: {
        seller: { include: { profile: { select: { username: true } } } },
      },
    });

    const out: ExplainableRecommendation[] = [];

    for (const listing of listings) {
      const text = `${listing.title} ${listing.description}`.toLowerCase();
      const matched = entities.filter((e) =>
        text.includes(e.value.toLowerCase()),
      );
      const score =
        entities.length === 0
          ? 50
          : Math.round((matched.length / Math.max(entities.length, 1)) * 100);

      if (score < 40) continue;

      out.push({
        id: `opportunity:listing:${listing.id}`,
        kind: "opportunity",
        targetType: "opportunity",
        targetId: listing.id,
        title: listing.title,
        subtitle: listing.type.replace(/_/g, " "),
        overallMatch: Math.min(98, score + 20),
        why: [
          matched.length
            ? `Matched: ${matched.map((m) => m.value).join(", ")}`
            : "Marketplace listing in your broad field",
          matched.length < entities.length / 2
            ? "Some requirements may need verification in graph"
            : "Strong alignment with your graph skills/topics",
        ],
        actions: ["profile", "save"] as const,
        metadata: {
          opportunityType: "MARKETPLACE",
          sellerUsername: listing.seller.profile?.username,
        },
      });
    }

    return out.sort((a, b) => b.overallMatch - a.overallMatch).slice(0, 8);
  }
}
