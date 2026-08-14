import { container } from "@/application/container";
import { prisma } from "@/infrastructure/database/prisma";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";
import {
  NextBestActionService,
  utcDateOnly,
} from "@/application/intelligence/next-best-action-service";
import { classifyActivitySegment } from "@/domain/intelligence/activity-segment";
import type { ExplainableRecommendation } from "@/domain/recommendations/types";

export class GetTodayIntelligence {
  async execute(userId: string) {
    const activation = new ProfileActivationService();
    const snapshot = await activation.gather(userId);
    const nba = await new NextBestActionService().generate(userId);
    const profile = snapshot?.profile;
    const today = utcDateOnly();

    const previous = await prisma.dailyIntelligenceSnapshot.findFirst({
      where: { userId, date: { lt: today } },
      orderBy: { date: "desc" },
    });
    const weekAgo = await prisma.dailyIntelligenceSnapshot.findFirst({
      where: {
        userId,
        date: { lte: new Date(today.getTime() - 6 * 86400000) },
      },
      orderBy: { date: "desc" },
    });

    const score = snapshot?.readiness.score ?? 0;
    const weekDelta = weekAgo ? score - weekAgo.readinessScore : 0;
    const dayDelta = previous ? score - previous.readinessScore : 0;

    await prisma.dailyIntelligenceSnapshot.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        readinessScore: score,
        readinessDelta: dayDelta,
        primaryActionId: nba.primaryAction.id,
        recommendationSummary: {
          actionType: nba.primaryAction.type,
        },
      },
      update: {
        readinessScore: score,
        readinessDelta: dayDelta,
        primaryActionId: nba.primaryAction.id,
      },
    });

    const recs = profile?.allowRecommendations
      ? await container.recommendations.getForYouFeed(userId).catch(() => null)
      : null;

    const people = (recs?.peopleYouShouldKnow ?? []).slice(0, 3);
    const knowledge = (recs?.knowledgeForYou ?? []).slice(0, 2);
    const opportunities = (recs?.opportunities ?? []).slice(0, 1);

    const twin = await this.twinSummary(userId);
    const monthCount = await prisma.meaningfulActivity.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
    });
    const weekCount = await prisma.meaningfulActivity.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
      },
    });

    const search = await this.searchImpressions(
      profile?.username ?? null,
    );
    const consult = await prisma.consultationOffer.findUnique({
      where: { userId },
      select: { enabled: true },
    });
    const listingCount = await prisma.marketplaceListing.count({
      where: { sellerId: userId },
    });

    return {
      greetingName: profile?.displayName ?? "there",
      profileType: profile?.profileType ?? null,
      readiness: {
        score,
        level: snapshot?.readiness.level ?? "STARTING",
        weekDelta,
        missing: snapshot?.readiness.missing ?? [],
        recommendations: snapshot?.readiness.recommendations ?? [],
      },
      activationStatus: profile?.activationStatus ?? "REGISTERED",
      primaryAction: nba.primaryAction,
      secondaryActions: nba.secondaryActions,
      challenge: nba.challenge,
      relevant: {
        people: people.map(mapRec),
        knowledge: knowledge.map(mapRec),
        opportunities: opportunities.map(mapRec),
        twinActivity: twin.questionsAnswered > 0,
      },
      twin,
      consistency: {
        monthUpdates: monthCount,
        weekUpdates: weekCount,
      },
      search,
      segment: classifyActivitySegment(profile?.lastMeaningfulActivityAt ?? null),
      monetization: monetizationHint({
        profileType: profile?.profileType ?? null,
        readiness: score,
        knowledgeCount:
          profile?.user.knowledgeSources.filter((s) => s.status === "READY")
            .length ?? 0,
        consultationEnabled: Boolean(consult?.enabled),
        listingCount,
      }),
    };
  }

  private async twinSummary(userId: string) {
    const since = new Date(Date.now() - 30 * 86400000);
    const events = await prisma.twinQueryEvent.findMany({
      where: { ownerUserId: userId, createdAt: { gte: since } },
      select: { intent: true, confidence: true, confidenceLevel: true },
      take: 200,
    });
    const avg =
      events.length === 0
        ? 0
        : events.reduce((s, e) => s + e.confidence, 0) / events.length;
    const intents = new Map<string, number>();
    for (const e of events) {
      intents.set(e.intent, (intents.get(e.intent) ?? 0) + 1);
    }
    const topics = [...intents.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([intent]) => intent.replaceAll("_", " "));

    const knowledgeReady = await prisma.knowledgeSource.count({
      where: { userId, status: "READY" },
    });

    return {
      questionsAnswered: events.length,
      confidencePct: Math.round(avg * 100),
      coverage: knowledgeReady >= 3 ? "Good" : knowledgeReady > 0 ? "Building" : "Limited",
      topics,
      suggestion:
        knowledgeReady === 0
          ? "Your Twin has limited information. Add one knowledge source or project."
          : topics.length
            ? `Your Twin was asked about ${topics.join(", ")}.`
            : "Teach your Twin something visitors should know.",
    };
  }

  private async searchImpressions(username: string | null) {
    if (!username) {
      return { searches: 0, visits: 0 };
    }
    const since = new Date(Date.now() - 7 * 86400000);
    const [searches, visits] = await Promise.all([
      prisma.searchEvent.count({
        where: { createdAt: { gte: since }, topUsername: username },
      }),
      prisma.searchEvent.count({
        where: { createdAt: { gte: since }, clickedUsername: username },
      }),
    ]);
    return { searches, visits };
  }
}

function mapRec(item: ExplainableRecommendation) {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    why: item.why,
    targetType: item.targetType,
    targetId: item.targetId,
    overallMatch: item.overallMatch,
  };
}

function monetizationHint(input: {
  profileType: string | null;
  readiness: number;
  knowledgeCount: number;
  consultationEnabled: boolean;
  listingCount: number;
}) {
  if (input.readiness < 61) return null;
  if (
    input.profileType === "CREATOR" &&
    input.knowledgeCount >= 5 &&
    input.listingCount === 0
  ) {
    return {
      title: "Turn your best knowledge into a paid guide.",
      href: "/marketplace/sell",
      cta: "Create Guide",
    };
  }
  if (input.readiness >= 81 && !input.consultationEnabled && input.profileType !== "STUDENT") {
    return {
      title: "Your expertise is discoverable. Enable consultation booking when you are ready.",
      href: "/settings/consultations",
      cta: "Enable Consultation",
    };
  }
  if (input.profileType === "FOUNDER") {
    return {
      title: "Create a verified organization profile when you are ready.",
      href: "/orgs/new",
      cta: "Create Organization",
    };
  }
  if (input.readiness >= 81 && input.listingCount === 0) {
    return {
      title:
        "Your profile is Intelligence Ready. You can offer consultation, paid knowledge, or premium Twin access.",
      href: "/hub/marketplace",
      cta: "Explore Monetization",
    };
  }
  return null;
}
