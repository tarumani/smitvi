import { prisma } from "@/infrastructure/database/prisma";
import { ACTIVATION_STATUS_ORDER } from "@/domain/profile/activation";
import type { ProfileActivationStatus } from "@/generated/prisma/client";

export class GetActivationAnalytics {
  async execute() {
    const [byStatus, avgReady, types, lowQuality, drafted, skills] =
      await Promise.all([
        prisma.profile.groupBy({
          by: ["activationStatus"],
          _count: { _all: true },
        }),
        prisma.profile.aggregate({
          _avg: { intelligenceReadinessScore: true },
        }),
        prisma.profile.groupBy({
          by: ["profileType"],
          _count: { _all: true },
        }),
        prisma.profile.count({
          where: {
            OR: [
              { bio: null },
              { bio: "" },
              { intelligenceReadinessScore: { lt: 21 } },
            ],
          },
        }),
        prisma.auditLog.count({
          where: { action: "PROFILE_AI_ANALYSIS_COMPLETED" },
        }),
        prisma.skill.findMany({
          take: 12,
          orderBy: { profiles: { _count: "desc" } },
          select: { name: true, _count: { select: { profiles: true } } },
        }),
      ]);

    const registered = await prisma.user.count({
      where: { deletedAt: null },
    });

    const counts = Object.fromEntries(
      ACTIVATION_STATUS_ORDER.map((s) => [s, 0]),
    ) as Record<ProfileActivationStatus, number>;
    for (const row of byStatus) {
      counts[row.activationStatus] = row._count._all;
    }

    const pct = (n: number) =>
      registered === 0 ? 0 : Math.round((n / registered) * 1000) / 10;

    const funnel = ACTIVATION_STATUS_ORDER.map((status, index) => {
      const reached = ACTIVATION_STATUS_ORDER.slice(index).reduce(
        (sum, key) => sum + counts[key],
        0,
      );
      return {
        status,
        count: status === "REGISTERED" ? registered : reached,
        percent: pct(status === "REGISTERED" ? registered : reached),
      };
    });

    const dropOff = funnel.map((step, i) => {
      const prev = i === 0 ? registered : funnel[i - 1].count;
      return {
        status: step.status,
        dropOff: Math.max(0, prev - step.count),
      };
    });

    return {
      registered,
      funnel,
      dropOff,
      averageIntelligenceReadiness:
        Math.round((avgReady._avg.intelligenceReadinessScore ?? 0) * 10) / 10,
      lowQualityProfiles: lowQuality,
      incompleteProfiles: counts.REGISTERED + counts.ONBOARDING_STARTED,
      profilesImprovedWithAi: drafted,
      profileTypes: types.map((t) => ({
        type: t.profileType,
        count: t._count._all,
      })),
      topSkills: skills.map((s) => ({
        name: s.name,
        count: s._count.profiles,
      })),
    };
  }
}
