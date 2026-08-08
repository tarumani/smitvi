import type { TwinConfidenceLevel, TwinFeedbackType } from "@/domain/twin/types";
import type { TwinIntent, TwinSource } from "@/domain/twin/types";
import { prisma } from "@/infrastructure/database/prisma";

export class TwinAnalyticsService {
  async recordQuery(input: {
    userId: string;
    ownerUserId: string;
    question: string;
    intent: TwinIntent;
    sources: TwinSource[];
    confidence: number;
    confidenceLevel: TwinConfidenceLevel;
    latencyMs: number;
    graphUsed: boolean;
    ragUsed: boolean;
  }) {
    try {
      await prisma.twinQueryEvent.create({
        data: {
          userId: input.userId,
          ownerUserId: input.ownerUserId,
          question: input.question.slice(0, 2000),
          intent: input.intent,
          sources: input.sources,
          confidence: input.confidence,
          confidenceLevel: input.confidenceLevel,
          latencyMs: input.latencyMs,
          graphUsed: input.graphUsed,
          ragUsed: input.ragUsed,
        },
      });
    } catch {
      /* non-blocking if migration pending */
    }
  }

  async recordFeedback(input: {
    userId: string;
    conversationId?: string | null;
    messageId?: string | null;
    feedback: TwinFeedbackType;
    note?: string | null;
  }) {
    await prisma.twinFeedback.create({
      data: {
        userId: input.userId,
        conversationId: input.conversationId ?? null,
        messageId: input.messageId ?? null,
        feedback: input.feedback,
        note: input.note?.slice(0, 500) ?? null,
      },
    });
  }

  async getAdminSummary(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [total, lowConfidence, unknownIntent, feedbackRows, avgLatency] =
      await Promise.all([
        prisma.twinQueryEvent.count({ where: { createdAt: { gte: since } } }),
        prisma.twinQueryEvent.count({
          where: {
            createdAt: { gte: since },
            confidenceLevel: { in: ["LOW", "UNKNOWN"] },
          },
        }),
        prisma.twinQueryEvent.count({
          where: { createdAt: { gte: since }, intent: "UNKNOWN" },
        }),
        prisma.twinFeedback.groupBy({
          by: ["feedback"],
          where: { createdAt: { gte: since } },
          _count: { id: true },
        }),
        prisma.twinQueryEvent.aggregate({
          where: { createdAt: { gte: since } },
          _avg: { latencyMs: true },
        }),
      ]);

    return {
      totalQueries: total,
      lowConfidenceAnswers: lowConfidence,
      unknownIntents: unknownIntent,
      feedback: feedbackRows.map((r) => ({
        type: r.feedback,
        count: r._count.id,
      })),
      avgLatencyMs: Math.round(avgLatency._avg.latencyMs ?? 0),
      graphRetrievalRate:
        total > 0
          ? Math.round(
              ((await prisma.twinQueryEvent.count({
                where: { createdAt: { gte: since }, graphUsed: true },
              })) /
                total) *
                100,
            )
          : 0,
    };
  }
}
