import { prisma } from "@/infrastructure/database/prisma";
import { container } from "@/application/container";
import { startOfWeek } from "@/application/intelligence/next-best-action-service";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";

export class WeeklyIntelligenceReportService {
  async getOrCreate(userId: string) {
    const weekStart = startOfWeek(new Date());
    const existing = await prisma.weeklyIntelligenceReport.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
    });
    if (existing) return existing;

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);

    const snapshot = await new ProfileActivationService().gather(userId);
    const score = snapshot?.readiness.score ?? 0;

    const prevReport = await prisma.weeklyIntelligenceReport.findUnique({
      where: { userId_weekStart: { userId, weekStart: prevWeekStart } },
    });
    const prevScore =
      typeof prevReport?.metricsSnapshot === "object" &&
      prevReport.metricsSnapshot !== null &&
      "readinessScore" in prevReport.metricsSnapshot
        ? Number((prevReport.metricsSnapshot as { readinessScore?: number }).readinessScore)
        : score;

    const activities = await prisma.meaningfulActivity.findMany({
      where: {
        userId,
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    });

    const twinAnswered = await prisma.twinQueryEvent.count({
      where: {
        ownerUserId: userId,
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    });

    const skills = activities.filter((a) => a.type === "SKILL_CONFIRMED").length;
    const projects = activities.filter((a) => a.type === "PROJECT_ADDED").length;
    const connections = activities.filter((a) => a.type === "CONNECTION_MADE").length;
    const knowledge = activities.filter((a) => a.type === "KNOWLEDGE_ADDED").length;

    const delta = score - (Number.isFinite(prevScore) ? prevScore : score);
    const metrics = {
      readinessScore: score,
      previousScore: Number.isFinite(prevScore) ? prevScore : score,
      delta,
      skillsAdded: skills,
      projectsAdded: projects,
      connectionsMade: connections,
      knowledgeAdded: knowledge,
      twinAnswered,
    };

    const next = snapshot?.readiness.recommendations[0]?.message
      ?? "Keep adding confirmed details to grow your Intelligence Profile.";

    const summary = `Intelligence Readiness ${metrics.previousScore} → ${score} (${delta >= 0 ? "+" : ""}${delta}).`;

    const created = await prisma.weeklyIntelligenceReport.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        metricsSnapshot: metrics,
        summary,
        recommendations: [{ message: next }],
      },
    });

    await container.auditLogs.create({
      actorId: userId,
      action: "INTELLIGENCE_WEEKLY_REPORT",
      entityType: "weekly_intelligence_report",
      entityId: created.id,
      metadata: { weekStart: weekStart.toISOString() },
    });

    return created;
  }
}
