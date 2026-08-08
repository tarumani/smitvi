import type { RecommendationFeedbackType } from "@/generated/prisma/client";
import type { RecommendationActionType } from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { recommendationCache } from "@/infrastructure/recommendations/recommendation-cache";

export class RecommendationAnalyticsService {
  async recordAction(input: {
    userId: string;
    recommendationId: string;
    action: string;
    recommendationType?: string;
    targetType?: string;
    targetId?: string;
    score?: number;
  }) {
    const [kind, targetId] = parseRecommendationId(input.recommendationId);
    await prisma.recommendationEvent.create({
      data: {
        userId: input.userId,
        recommendationType: input.recommendationType ?? kind,
        targetType: input.targetType ?? "user",
        targetId: input.targetId ?? targetId,
        action: mapAction(input.action),
        score: input.score ?? null,
      },
    });
  }

  async recordFeedback(input: {
    userId: string;
    recommendationId: string;
    feedback: RecommendationFeedbackType;
  }) {
    await prisma.recommendationFeedback.upsert({
      where: {
        userId_recommendationKey: {
          userId: input.userId,
          recommendationKey: input.recommendationId.slice(0, 128),
        },
      },
      create: {
        userId: input.userId,
        recommendationKey: input.recommendationId.slice(0, 128),
        feedback: input.feedback,
      },
      update: { feedback: input.feedback },
    });
    recommendationCache.invalidate(input.userId);
  }

  async getAdminSummary(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [byType, clicks, dismissals, topTargets] = await Promise.all([
      prisma.recommendationEvent.groupBy({
        by: ["recommendationType"],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
      prisma.recommendationEvent.count({
        where: {
          createdAt: { gte: since },
          action: { in: ["CLICK", "PROFILE_OPEN"] },
        },
      }),
      prisma.recommendationFeedback.count({
        where: { createdAt: { gte: since }, feedback: "DISMISS" },
      }),
      prisma.recommendationEvent.groupBy({
        by: ["targetId"],
        where: {
          createdAt: { gte: since },
          action: "PROFILE_OPEN",
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 15,
      }),
    ]);

    const graphHealth = await this.graphHealthSnapshot();

    return {
      byType: byType.map((r) => ({
        type: r.recommendationType,
        count: r._count.id,
      })),
      profileOpenRate: clicks,
      dismissCount: dismissals,
      topRecommendedTargets: topTargets.map((t) => ({
        targetId: t.targetId,
        opens: t._count.id,
      })),
      graphHealth,
    };
  }

  async graphHealthSnapshot() {
    const [entities, relationships, evidence, usersWithGraph] = await Promise.all([
      prisma.graphEntity.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.graphRelationship.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.graphEvidence.count(),
      prisma.graphEntity.count({
        where: { entityType: "USER", linkedUserId: { not: null } },
      }),
    ]);

    const profiles = await prisma.profile.count();

    return {
      entityCount: entities,
      relationshipCount: relationships,
      evidenceCount: evidence,
      userAnchors: usersWithGraph,
      profileCount: profiles,
      completenessRatio:
        profiles > 0 ? Math.round((usersWithGraph / profiles) * 100) : 0,
    };
  }
}

function parseRecommendationId(id: string): [string, string] {
  const idx = id.indexOf(":");
  if (idx === -1) return ["expert", id];
  return [id.slice(0, idx), id.slice(idx + 1)];
}

function mapAction(action: string): RecommendationActionType {
  const map: Record<string, RecommendationActionType> = {
    shown: "SHOWN",
    click: "CLICK",
    profile_open: "PROFILE_OPEN",
    follow: "FOLLOW",
    connect: "CONNECT",
    message: "MESSAGE",
    save: "SAVE",
    dismiss: "DISMISS",
    hire: "HIRE",
    knowledge_open: "KNOWLEDGE_OPEN",
    opportunity_open: "OPPORTUNITY_OPEN",
    converted: "CONVERTED",
  };
  return map[action.toLowerCase()] ?? "CLICK";
}
