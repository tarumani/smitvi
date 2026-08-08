import type { SearchCategory, UnifiedSearchResponse } from "@/domain/search/types";
import { QueryUnderstandingService } from "@/application/search/query-understanding";
import {
  ExpertRankingService,
  buildRankingExplanation,
} from "@/application/search/expert-ranking-service";
import { SearchAnalyticsService } from "@/application/search/search-analytics-service";
import type { GraphService } from "@/application/graph/graph-service";
import {
  GraphSearchService,
  GraphSearchRepository,
} from "@/infrastructure/database/repositories/graph-search-repository";
import type { PrismaSearchRepository } from "@/infrastructure/database/repositories/search-repository";
import { SemanticVectorRepository } from "@/infrastructure/database/repositories/semantic-vector-repository";
import { cacheKey, searchCache } from "@/infrastructure/search/search-cache";
import { prisma } from "@/infrastructure/database/prisma";

export class UnifiedSearchService {
  private readonly queryUnderstanding: QueryUnderstandingService;
  private readonly graphSearch: GraphSearchService;
  private readonly ranking: ExpertRankingService;
  private readonly semantic: SemanticVectorRepository;
  private readonly analytics: SearchAnalyticsService;

  constructor(
    graph: GraphService,
    private readonly keywordSearch: PrismaSearchRepository,
  ) {
    const graphRepo = new GraphSearchRepository();
    this.queryUnderstanding = new QueryUnderstandingService(graph);
    this.graphSearch = new GraphSearchService(graphRepo);
    this.ranking = new ExpertRankingService();
    this.semantic = new SemanticVectorRepository();
    this.analytics = new SearchAnalyticsService();
  }

  async search(input: {
    query: string;
    type?: SearchCategory;
    limit?: number;
    filters?: Record<string, unknown>;
    sessionId?: string | null;
  }): Promise<UnifiedSearchResponse> {
    const limit = Math.min(input.limit ?? 20, 40);
    const ck = cacheKey([input.query, input.type ?? "all", String(limit)]);
    const cached = searchCache.getResult<UnifiedSearchResponse>(ck);
    if (cached) return cached;

    const interpretedQuery = await this.queryUnderstanding.interpret(
      input.query,
    );

    const [keywordResults, semanticOwners, graphCandidates] = await Promise.all([
      this.keywordSearch.search(input.query, limit),
      this.semantic.searchPublicOwnersByQuery(input.query, limit),
      this.graphSearch.findExpertsByMultipleCriteria(interpretedQuery.entities),
    ]);

    const keywordUserIds = new Set(
      keywordResults.people.map((p) => p.username),
    );

    const profileByUsername = await prisma.profile.findMany({
      where: {
        username: { in: [...keywordUserIds] },
      },
      select: { userId: true, username: true },
    });
    const usernameToUserId = new Map(
      profileByUsername.map((p) => [p.username, p.userId]),
    );

    const semanticScores = new Map<string, number>();
    for (const s of semanticOwners) {
      semanticScores.set(s.userId, s.score);
    }

    const mergedIds = new Set<string>([
      ...graphCandidates.keys(),
      ...semanticOwners.map((s) => s.userId),
      ...profileByUsername.map((p) => p.userId),
    ]);

    const keywordUserIdSet = new Set(
      keywordResults.people
        .map((p) => usernameToUserId.get(p.username))
        .filter((id): id is string => Boolean(id)),
    );

    const experts = await this.ranking.rankExperts({
      userIds: [...mergedIds],
      interpretedEntities: interpretedQuery.entities,
      graphCandidates,
      semanticScores,
      keywordUserIds: keywordUserIdSet,
    });

    const required = interpretedQuery.entities.filter(
      (e) => e.requirement === "REQUIRED",
    );
    let partialMatchExperts: typeof experts | undefined;
    let knowledgeGap: UnifiedSearchResponse["knowledgeGap"];

    if (experts.length === 0 && required.length > 1) {
      const relaxed = await this.graphSearch.findExpertsByMultipleCriteria(
        required.slice(0, Math.max(1, required.length - 1)),
      );
      partialMatchExperts = await this.ranking.rankExperts({
        userIds: [...relaxed.keys()],
        interpretedEntities: required.slice(0, -1),
        graphCandidates: relaxed,
        semanticScores,
        keywordUserIds: new Set(),
      });
      knowledgeGap = {
        message: `No exact match for all criteria.`,
        satisfied: required.slice(0, -1).map((e) => e.value),
        missing: [required[required.length - 1]?.value].filter(Boolean),
        partialCount: partialMatchExperts.length,
      };
    }

    const rankingExplanation = experts[0]
      ? buildRankingExplanation(experts[0].breakdown)
      : "Results combine graph, keyword, and semantic signals with evidence-first ranking.";

    const projects = await this.searchProjects(interpretedQuery.entities, limit);

    const response: UnifiedSearchResponse = {
      interpretedQuery,
      total: experts.length,
      experts: experts.slice(0, limit),
      knowledge: keywordResults.knowledge,
      skills: keywordResults.skills,
      topics: keywordResults.topics,
      projects,
      partialMatchExperts: partialMatchExperts?.slice(0, limit),
      knowledgeGap,
      rankingExplanation,
    };

    searchCache.setResult(ck, response);

    void this.analytics.recordEvent({
      queryNormalized: interpretedQuery.normalized,
      intent: interpretedQuery.intent,
      filters: input.filters,
      resultCount: experts.length,
      topUsername: experts[0]?.username ?? null,
      sessionHash: input.sessionId
        ? this.analytics.hashSession(input.sessionId)
        : null,
    });

    return response;
  }

  async similarExperts(userId: string, limit = 12) {
    const similarIds = await this.graphSearch.findSimilarExperts(userId);
    const semanticScores = new Map<string, number>();
    return this.ranking.rankExperts({
      userIds: [...similarIds].slice(0, limit * 2),
      interpretedEntities: [],
      graphCandidates: new Map(),
      semanticScores,
      keywordUserIds: new Set(),
    });
  }

  async suggestions(partial: string) {
    const q = partial.trim().toLowerCase();
    if (q.length < 2) return [];

    const [skills, topics] = await Promise.all([
      prisma.skill.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
      prisma.$queryRaw<Array<{ topic: string }>>`
        SELECT DISTINCT topic
        FROM knowledge_sources ks
        CROSS JOIN unnest(ks.topics) AS topic
        WHERE ks.is_public = true AND topic ILIKE ${`%${q}%`}
        LIMIT 5
      `,
    ]);

    return [
      ...skills.map((s) => ({ type: "skill" as const, label: s.name })),
      ...topics.map((t) => ({ type: "topic" as const, label: t.topic })),
      { type: "query" as const, label: `${partial} experts` },
    ].slice(0, 8);
  }

  getFilters() {
    return {
      profession: true,
      skill: true,
      industry: true,
      technology: true,
      experience: true,
      location: true,
      verification: true,
    };
  }

  getAnalytics() {
    return this.analytics.getAdminSummary();
  }

  recordClick(query: string, username: string, successType: string) {
    return this.analytics.recordSuccess({
      queryNormalized: query.slice(0, 240),
      clickedUsername: username,
      successType,
    });
  }

  private async searchProjects(
    entities: UnifiedSearchResponse["interpretedQuery"]["entities"],
    limit: number,
  ) {
    const project = entities.find((e) => e.type === "PROJECT");
    if (!project) return [];

    const rows = await prisma.graphEntity.findMany({
      where: {
        entityType: "PROJECT",
        status: "ACTIVE",
        canonicalName: { contains: project.value.slice(0, 12), mode: "insensitive" },
        ownerUserId: { not: null },
      },
      take: limit,
      include: {
        ownerUser: {
          include: {
            profile: { select: { username: true, visibility: true } },
          },
        },
      },
    });

    return rows
      .filter((r) => r.ownerUser?.profile?.visibility === "PUBLIC")
      .map((r) => ({
        id: r.id,
        name: r.canonicalName,
        ownerUsername: r.ownerUser!.profile!.username,
      }));
  }
}
