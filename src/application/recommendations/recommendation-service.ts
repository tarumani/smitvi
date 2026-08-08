import type { InterpretedEntity } from "@/domain/search/types";
import type {
  ExplainableRecommendation,
  ForYouFeed,
  LearningGapItem,
  RecommendationBundle,
} from "@/domain/recommendations/types";
import type { GraphService } from "@/application/graph/graph-service";
import type { UnifiedSearchService } from "@/application/search/unified-search-service";
import { ExpertRankingService } from "@/application/search/expert-ranking-service";
import {
  GraphSearchRepository,
  GraphSearchService,
} from "@/infrastructure/database/repositories/graph-search-repository";
import { CollaborationService } from "@/application/recommendations/collaboration-service";
import { LearningGapService } from "@/application/recommendations/learning-gap-service";
import { OpportunityService } from "@/application/recommendations/opportunity-service";
import { RecommendationAnalyticsService } from "@/application/recommendations/recommendation-analytics-service";
import { recommendationCache } from "@/infrastructure/recommendations/recommendation-cache";
import { prisma } from "@/infrastructure/database/prisma";
import { qualifiedPublicHubProfileWhere } from "@/domain/profile/qualified-public-hub";

const COMPLEMENTARY_PROFESSIONS = [
  "React Developer",
  "Product Manager",
  "UX Researcher",
  "AI Engineer",
  "Full Stack Developer",
];

export class RecommendationService {
  private readonly graphSearch: GraphSearchService;
  private readonly ranking = new ExpertRankingService();
  private readonly collaboration: CollaborationService;
  private readonly learningGaps: LearningGapService;
  private readonly opportunities: OpportunityService;

  constructor(
    private readonly graph: GraphService,
    private readonly unifiedSearch: UnifiedSearchService,
    private readonly analytics: RecommendationAnalyticsService,
  ) {
    const repo = new GraphSearchRepository();
    this.graphSearch = new GraphSearchService(repo);
    this.collaboration = new CollaborationService(graph, this.ranking);
    this.learningGaps = new LearningGapService(graph);
    this.opportunities = new OpportunityService(graph, this.ranking);
  }

  async getBundle(userId: string): Promise<RecommendationBundle> {
    const cached = recommendationCache.get<RecommendationBundle>(userId);
    if (cached) return cached;

    const [
      experts,
      similar,
      complementary,
      mentors,
      collaborators,
      follow,
      knowledge,
      opportunities,
      learningGapItems,
    ] = await Promise.all([
      this.recommendExperts(userId),
      this.recommendSimilarExperts(userId),
      this.findComplementaryExperts(userId),
      this.recommendMentors(userId),
      this.recommendCollaborators(userId),
      this.recommendPeopleToFollow(userId),
      this.recommendKnowledge(userId),
      this.opportunities.matchForUser(userId),
      this.learningGaps.analyze(userId),
    ]);

    const bundle: RecommendationBundle = {
      experts,
      similar,
      complementary,
      mentors,
      collaborators,
      follow,
      knowledge,
      opportunities,
      learningGaps: learningGapItems,
    };

    recommendationCache.set(userId, bundle);
    return bundle;
  }

  async getForYouFeed(userId: string): Promise<ForYouFeed> {
    const b = await this.getBundle(userId);
    return {
      peopleYouShouldKnow: [...b.experts, ...b.similar].slice(0, 6),
      knowledgeForYou: b.knowledge.slice(0, 6),
      skillsToExplore: b.learningGaps.map((g) => ({
        id: `gap:${g.skillOrTopic}`,
        kind: "learning_gap" as const,
        targetType: "skill" as const,
        targetId: g.skillOrTopic,
        title: g.skillOrTopic,
        subtitle: g.whyItMatters,
        overallMatch: 85,
        why: g.suggestedLearning,
        actions: ["save", "dismiss"],
      })),
      projectsYouMayLike: b.knowledge
        .filter((k) => k.targetType === "knowledge")
        .slice(0, 4),
      collaborators: b.collaborators.slice(0, 6),
      opportunities: b.opportunities.slice(0, 6),
      trendingInExpertise: b.follow.slice(0, 4),
      learningGaps: b.learningGaps,
    };
  }

  async recommendExperts(userId: string): Promise<ExplainableRecommendation[]> {
    const entities = await this.viewerEntities(userId);
    if (entities.length === 0) return [];

    const candidates = await this.graphSearch.findExpertsByMultipleCriteria(
      entities.slice(0, 5),
    );
    candidates.delete(userId);

    return this.rankToRecommendations(
      userId,
      [...candidates.keys()],
      entities,
      "expert",
      new Map(),
    );
  }

  async recommendSimilarExperts(userId: string) {
    const ranked = await this.unifiedSearch.similarExperts(userId, 12);
    return ranked
      .filter((e) => e.userId !== userId)
      .slice(0, 8)
      .map((e) => expertRec("similar_expert", e, buildSimilarWhy(e)));
  }

  async findComplementaryExperts(userId: string) {
    const viewerGraph = await this.graph.getUserGraph(userId, userId);
    const viewerTypes = new Set(
      [
        ...viewerGraph.skills,
        ...viewerGraph.technologies,
        ...viewerGraph.expertise,
      ].map((x) => x.entity.canonicalName.toLowerCase()),
    );

    const entities: InterpretedEntity[] = COMPLEMENTARY_PROFESSIONS.filter(
      (p) => !viewerTypes.has(p.toLowerCase()),
    ).map((value) => ({
      type: "PROFESSION" as const,
      value,
      requirement: "OPTIONAL" as const,
      resolved: false,
      graphEntityId: null,
    }));

    if (viewerGraph.industries[0]) {
      entities.push({
        type: "INDUSTRY",
        value: viewerGraph.industries[0].entity.canonicalName,
        requirement: "REQUIRED",
        resolved: true,
        graphEntityId: viewerGraph.industries[0].entity.id,
      });
    }

    const candidates = await this.graphSearch.findExpertsByMultipleCriteria(
      entities,
    );
    candidates.delete(userId);

    return this.rankToRecommendations(
      userId,
      [...candidates.keys()],
      entities,
      "complementary_expert",
      new Map(),
      (e) =>
        `Complements your profile — strong in areas you may want to partner on (e.g. ${e.topSkills.slice(0, 2).join(", ") || "their expertise"}).`,
    );
  }

  async recommendMentors(userId: string) {
    const similar = await this.unifiedSearch.similarExperts(userId, 20);
    return similar
      .filter(
        (e) =>
          e.userId !== userId && e.breakdown.experienceMatch >= 0.5,
      )
      .sort(
        (a, b) =>
          b.breakdown.experienceMatch - a.breakdown.experienceMatch ||
          b.overallMatch - a.overallMatch,
      )
      .slice(0, 6)
      .map((e) =>
        expertRec(
          "mentor",
          e,
          `Experienced in ${e.topSkills.slice(0, 3).join(", ") || "your field"} — good mentor match.`,
        ),
      );
  }

  async recommendCollaborators(userId: string) {
    return this.collaboration.findMatches(userId);
  }

  async recommendPeopleToFollow(userId: string) {
    const experts = await this.recommendExperts(userId);
    return experts.slice(0, 8).map((e) => ({
      ...e,
      kind: "follow" as const,
      id: `follow:${e.targetId}`,
    }));
  }

  async recommendKnowledge(userId: string): Promise<ExplainableRecommendation[]> {
    const graph = await this.graph.getUserGraph(userId, userId);
    const topics = [
      ...graph.topics.map((t) => t.entity.canonicalName),
      ...graph.skills.map((s) => s.entity.canonicalName),
    ].slice(0, 6);

    if (topics.length === 0) return [];

    const sources = await prisma.knowledgeSource.findMany({
      where: {
        isPublic: true,
        status: "READY",
        userId: { not: userId },
        OR: topics.flatMap((t) => [
          { topics: { has: t } },
          { tags: { has: t } },
          { title: { contains: t, mode: "insensitive" as const } },
        ]),
      },
      take: 12,
      include: {
        user: { include: { profile: { select: { username: true, displayName: true } } } },
      },
    });

    return sources.map((s) => ({
      id: `knowledge:${s.id}`,
      kind: "knowledge" as const,
      targetType: "knowledge" as const,
      targetId: s.id,
      title: s.title,
      subtitle: s.user.profile?.displayName ?? null,
      overallMatch: 82,
      why: [
        `Related to your interests: ${topics.slice(0, 3).join(", ")}`,
        s.summary?.slice(0, 120) ?? "Public knowledge on Smitvi",
      ],
      actions: ["save", "profile"] as const,
      metadata: { ownerUsername: s.user.profile?.username },
    }));
  }

  private async viewerEntities(userId: string): Promise<InterpretedEntity[]> {
    const g = await this.graph.getUserGraph(userId, userId);
    const out: InterpretedEntity[] = [];
    const push = (
      items: typeof g.skills,
      type: InterpretedEntity["type"],
    ) => {
      for (const { entity } of items) {
        out.push({
          type,
          value: entity.canonicalName,
          requirement: "OPTIONAL",
          resolved: true,
          graphEntityId: entity.id,
        });
      }
    };
    push(g.skills, "SKILL");
    push(g.industries, "INDUSTRY");
    push(g.topics, "TOPIC");
    push(g.technologies, "TECHNOLOGY");
    return out;
  }

  private async rankToRecommendations(
    userId: string,
    candidateUserIds: string[],
    entities: InterpretedEntity[],
    kind: ExplainableRecommendation["kind"],
    semanticScores: Map<string, number>,
    whyFn?: (e: import("@/domain/search/types").RankedExpertResult) => string,
  ): Promise<ExplainableRecommendation[]> {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingSet = new Set(following.map((f) => f.followingId));

    const filtered = candidateUserIds.filter(
      (id) => id !== userId && !followingSet.has(id),
    );

    const ranked = await this.ranking.rankExperts({
      userIds: filtered.slice(0, 40),
      interpretedEntities: entities,
      graphCandidates: new Map(),
      semanticScores,
      keywordUserIds: new Set(),
    });

    return ranked.slice(0, 10).map((e) =>
      expertRec(
        kind,
        e,
        whyFn?.(e) ?? buildDefaultWhy(e),
      ),
    );
  }

  recordAction = this.analytics.recordAction.bind(this.analytics);
  recordFeedback = this.analytics.recordFeedback.bind(this.analytics);
}

function expertRec(
  kind: ExplainableRecommendation["kind"],
  e: import("@/domain/search/types").RankedExpertResult,
  whyLine: string,
): ExplainableRecommendation {
  return {
    id: `${kind}:${e.userId}`,
    kind,
    targetType: "user",
    targetId: e.userId,
    title: e.displayName,
    subtitle: e.headline,
    overallMatch: e.overallMatch,
    breakdown: {
      skills: Math.round(e.breakdown.skillMatch * 100),
      industry: Math.round(e.breakdown.industryMatch * 100),
      projects: Math.round(e.breakdown.projectMatch * 100),
      technology: Math.round(e.breakdown.technologyMatch * 100),
      graphSimilarity: Math.round(e.breakdown.graphConnectivity * 100),
    },
    why: [...e.whyMatch.slice(0, 4), whyLine],
    actions: ["follow", "message", "profile"],
    expert: e,
    metadata: { username: e.username },
  };
}

function buildDefaultWhy(
  e: import("@/domain/search/types").RankedExpertResult,
): string {
  const parts = e.matchedCriteria.slice(0, 3);
  if (parts.length === 0) {
    return "Recommended based on graph overlap and public expertise signals.";
  }
  return `Recommended because you share ${parts.join(", ")}.`;
}

function buildSimilarWhy(
  e: import("@/domain/search/types").RankedExpertResult,
): string {
  return `Similar expertise profile (${e.overallMatch}% graph similarity).`;
}
