import type { ExplainableRecommendation } from "@/domain/recommendations/types";
import type { GraphService } from "@/application/graph/graph-service";
import { ExpertRankingService } from "@/application/search/expert-ranking-service";
import { GraphSearchRepository, GraphSearchService } from "@/infrastructure/database/repositories/graph-search-repository";
import { prisma } from "@/infrastructure/database/prisma";
import { qualifiedPublicHubProfileWhere } from "@/domain/profile/qualified-public-hub";

export class CollaborationService {
  private readonly graphSearch: GraphSearchService;

  constructor(
    private readonly graph: GraphService,
    private readonly ranking: ExpertRankingService,
  ) {
    this.graphSearch = new GraphSearchService(new GraphSearchRepository());
  }

  async findMatches(userId: string): Promise<ExplainableRecommendation[]> {
    const viewer = await this.graph.getUserGraph(userId, userId);
    const viewerSkillSet = new Set(
      viewer.skills.map((s) => s.entity.canonicalName.toLowerCase()),
    );
    const viewerTech = new Set(
      viewer.technologies.map((t) => t.entity.canonicalName.toLowerCase()),
    );

    const pool = await prisma.profile.findMany({
      where: {
        ...qualifiedPublicHubProfileWhere,
        userId: { not: userId },
      },
      take: 60,
      include: {
        skills: { include: { skill: true }, take: 10 },
        user: { select: { id: true } },
      },
    });

    const scored: Array<{ profile: (typeof pool)[0]; score: number; why: string }> = [];

    for (const p of pool) {
      const theirSkills = p.skills.map((s) => s.skill.name.toLowerCase());
      const overlap = theirSkills.filter((s) => viewerSkillSet.has(s)).length;
      const complement = theirSkills.filter(
        (s) => !viewerSkillSet.has(s) && !viewerTech.has(s),
      ).length;

      const industryMatch =
        viewer.industries.length > 0 && p.headline?.toLowerCase().includes(
          viewer.industries[0]!.entity.canonicalName.toLowerCase().slice(0, 6),
        )
          ? 0.8
          : 0.3;

      const score =
        0.35 * Math.min(1, complement / 4) +
        0.25 * industryMatch +
        0.2 * Math.min(1, overlap / 3) +
        0.2 * (p.skills.length >= 3 ? 0.7 : 0.4);

      if (score < 0.45) continue;

      scored.push({
        profile: p,
        score,
        why: `You may be a good match — complementary skills (${theirSkills.slice(0, 2).join(", ")}) with shared domain potential.`,
      });
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 8).map(({ profile, score, why }) => ({
      id: `collaborator:${profile.userId}`,
      kind: "collaborator",
      targetType: "user",
      targetId: profile.userId,
      title: profile.displayName,
      subtitle: profile.headline,
      overallMatch: Math.round(score * 100),
      why: [why, "Potential product team / project collaboration."],
      actions: ["follow", "message", "profile"] as const,
      metadata: { username: profile.username },
    }));
  }
}
