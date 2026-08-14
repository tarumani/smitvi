import { prisma } from "@/infrastructure/database/prisma";
import { container } from "@/application/container";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";
import {
  buildActionCandidates,
  pickDailyChallenge,
  scoreCandidate,
  type NextBestActionCandidate,
} from "@/domain/intelligence/next-best-action";
import type { IntelligenceActionType } from "@/generated/prisma/client";
import { ROUTES } from "@/config/constants";

const DAY_MS = 24 * 60 * 60 * 1000;

export class NextBestActionService {
  async generate(userId: string): Promise<{
    primaryAction: NextBestActionCandidate & { id: string; priority: number };
    secondaryActions: Array<NextBestActionCandidate & { id: string; priority: number }>;
    challenge: (NextBestActionCandidate & { id: string }) | null;
  }> {
    const ctx = await this.context(userId);
    const ranked = buildActionCandidates(ctx);
    const primary = ranked[0];
    const secondary = ranked.slice(1, 4);
    const challengeTpl = pickDailyChallenge(new Date().getDay(), ranked);

    const persist = async (candidate: NextBestActionCandidate) => {
      const existing = await prisma.nextBestAction.findFirst({
        where: {
          userId,
          type: candidate.type,
          status: "PENDING",
          generatedAt: { gte: new Date(Date.now() - DAY_MS) },
        },
      });
      if (existing) {
        return {
          ...candidate,
          id: existing.id,
          priority: existing.priority,
        };
      }
      const row = await prisma.nextBestAction.create({
        data: {
          userId,
          type: candidate.type,
          title: candidate.title,
          description: candidate.description,
          priority: scoreCandidate(candidate),
          expiresAt: new Date(Date.now() + DAY_MS),
          metadata: {
            estimatedMinutes: candidate.estimatedMinutes,
            expectedImpact: candidate.expectedImpact,
            href: candidate.href,
            cta: candidate.cta,
          },
        },
      });
      return {
        ...candidate,
        id: row.id,
        priority: row.priority,
      };
    };

    if (!primary) {
      return { primaryAction: await persist(fallbackAction()), secondaryActions: [], challenge: null };
    }

    const primarySaved = await persist(primary);
    const secondarySaved = await Promise.all(secondary.map(persist));
    const challenge = challengeTpl
      ? secondarySaved.find((s) => s.type === challengeTpl.type) ?? primarySaved
      : null;

    return {
      primaryAction: primarySaved,
      secondaryActions: secondarySaved,
      challenge,
    };
  }

  async complete(userId: string, actionId: string, source = "today") {
    const action = await prisma.nextBestAction.findFirst({
      where: { id: actionId, userId },
    });
    if (!action) return null;
    await prisma.nextBestAction.update({
      where: { id: actionId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await prisma.userActionCompletion.create({
      data: {
        userId,
        actionType: action.type,
        source,
        impact: action.metadata as object,
      },
    });
    const { recordMeaningfulActivity } = await import(
      "@/application/intelligence/record-meaningful-activity"
    );
    await recordMeaningfulActivity({
      userId,
      type: "ACTION_COMPLETED",
      title: action.title,
      metadata: { actionType: action.type },
    });
    await container.auditLogs.create({
      actorId: userId,
      action: "INTELLIGENCE_ACTION_COMPLETED",
      entityType: "next_best_action",
      entityId: actionId,
      metadata: { type: action.type },
    });
    return action;
  }

  async dismiss(userId: string, actionId: string) {
    const action = await prisma.nextBestAction.findFirst({
      where: { id: actionId, userId, status: "PENDING" },
    });
    if (!action) return null;
    await prisma.nextBestAction.update({
      where: { id: actionId },
      data: { status: "DISMISSED", dismissedAt: new Date() },
    });
    return action;
  }

  private async context(userId: string) {
    const since3 = new Date(Date.now() - 3 * DAY_MS);
    const since7 = new Date(Date.now() - 7 * DAY_MS);
    const since14 = new Date(Date.now() - 14 * DAY_MS);
    const since30 = new Date(Date.now() - 30 * DAY_MS);

    const snapshot = await new ProfileActivationService().gather(userId);
    const profile = snapshot?.profile;

    const [
      shown,
      dismissed,
      completed,
      twinCount,
      listings,
      consult,
      recs,
    ] = await Promise.all([
      prisma.nextBestAction.findMany({
        where: { userId, generatedAt: { gte: since3 } },
        select: { type: true },
      }),
      prisma.nextBestAction.findMany({
        where: {
          userId,
          status: "DISMISSED",
          dismissedAt: { gte: since14 },
        },
        select: { type: true },
      }),
      prisma.userActionCompletion.findMany({
        where: { userId, completedAt: { gte: since7 } },
        select: { actionType: true },
      }),
      prisma.twinQueryEvent.count({
        where: { ownerUserId: userId, createdAt: { gte: since30 } },
      }),
      prisma.marketplaceListing.count({ where: { sellerId: userId } }),
      prisma.consultationOffer.findUnique({
        where: { userId },
        select: { enabled: true },
      }),
      container.recommendations.getForYouFeed(userId).catch(() => null),
    ]);

    const weekStart = startOfWeek(new Date());
    const weekSnap = await prisma.dailyIntelligenceSnapshot.findFirst({
      where: { userId, date: weekStart },
    });

    return {
      profileType: profile?.profileType ?? null,
      activationStatus: profile?.activationStatus ?? "REGISTERED",
      readinessScore: snapshot?.readiness.score ?? 0,
      missing: snapshot?.readiness.missing ?? [],
      skillCount: profile?.skills.length ?? 0,
      experienceCount: profile?.experiences.length ?? 0,
      projectCount: profile?.portfolio.length ?? 0,
      knowledgeCount:
        profile?.user.knowledgeSources.filter((s) => s.status === "READY")
          .length ?? 0,
      graphCount: 0,
      twinQueryCount30d: twinCount,
      followCount: profile?.followingCount ?? 0,
      marketplaceListingCount: listings,
      consultationEnabled: Boolean(consult?.enabled),
      appearInDiscovery: Boolean(profile?.appearInExpertDiscovery),
      opportunityCount: recs?.opportunities.length ?? 0,
      recommendationCount:
        (recs?.peopleYouShouldKnow.length ?? 0) +
        (recs?.knowledgeForYou.length ?? 0),
      weekStartReadiness: weekSnap?.readinessScore ?? null,
      shownTypesLast3Days: shown.map((s) => s.type as IntelligenceActionType),
      dismissedTypesLast14Days: dismissed.map(
        (s) => s.type as IntelligenceActionType,
      ),
      completedTypesLast7Days: completed.map(
        (s) => s.actionType as IntelligenceActionType,
      ),
    };
  }
}

function fallbackAction(): NextBestActionCandidate {
  return {
    type: "UPDATE_INTELLIGENCE",
    title: "Share a one-minute intelligence update",
    description: "Tell us what you worked on, learned, or built recently.",
    estimatedMinutes: 1,
    expectedImpact: { intelligenceReadiness: 8, graphConnections: 2 },
    href: ROUTES.hub.today + "?update=1",
    cta: "Update my intelligence",
    scores: {
      incompleteness: 5,
      highImpact: 15,
      relevance: 20,
      recentBehavior: 0,
      graphImprovement: 10,
      recentlyShown: 0,
      previouslyDismissed: 0,
      notRelevant: 0,
    },
  };
}

export function startOfWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function utcDateOnly(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
