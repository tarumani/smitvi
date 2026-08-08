import { createHash } from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export class SearchAnalyticsService {
  async recordEvent(input: {
    queryNormalized: string;
    intent: string;
    filters?: Record<string, unknown>;
    resultCount: number;
    topUsername?: string | null;
    sessionHash?: string | null;
  }): Promise<void> {
    const q = input.queryNormalized.slice(0, 240);
    await prisma.searchEvent.create({
      data: {
        queryNormalized: q,
        intent: input.intent.slice(0, 64),
        filters: (input.filters ?? {}) as Prisma.InputJsonValue,
        resultCount: input.resultCount,
        topUsername: input.topUsername?.slice(0, 30) ?? null,
        sessionHash: input.sessionHash ?? null,
      },
    });
  }

  async recordSuccess(input: {
    queryNormalized: string;
    clickedUsername: string;
    successType: string;
  }): Promise<void> {
    await prisma.searchEvent.create({
      data: {
        queryNormalized: input.queryNormalized.slice(0, 240),
        intent: "SUCCESS",
        resultCount: 0,
        clickedUsername: input.clickedUsername.slice(0, 30),
        successType: input.successType.slice(0, 32),
      },
    });
  }

  hashSession(id: string): string {
    return createHash("sha256").update(id).digest("hex").slice(0, 64);
  }

  async getAdminSummary(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [topQueries, zeroResults, byIntent, clicks] = await Promise.all([
      prisma.searchEvent.groupBy({
        by: ["queryNormalized"],
        where: { createdAt: { gte: since }, intent: { not: "SUCCESS" } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 20,
      }),
      prisma.searchEvent.count({
        where: {
          createdAt: { gte: since },
          resultCount: 0,
          intent: { not: "SUCCESS" },
        },
      }),
      prisma.searchEvent.groupBy({
        by: ["intent"],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
      prisma.searchEvent.groupBy({
        by: ["clickedUsername"],
        where: {
          createdAt: { gte: since },
          clickedUsername: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 15,
      }),
    ]);

    return {
      topQueries: topQueries.map((r) => ({
        query: r.queryNormalized,
        count: r._count.id,
      })),
      zeroResultSearches: zeroResults,
      intents: byIntent.map((r) => ({
        intent: r.intent,
        count: r._count.id,
      })),
      mostClickedExperts: clicks
        .filter((c) => c.clickedUsername)
        .map((c) => ({
          username: c.clickedUsername!,
          clicks: c._count.id,
        })),
    };
  }
}
