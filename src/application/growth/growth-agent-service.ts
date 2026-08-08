import type { Prisma } from "@/generated/prisma/client";
import type { GrowthJobType } from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { GrowthGapAnalyzer } from "@/application/growth/growth-gap-analyzer";
import {
  GrowthGraphMatchingService,
  ProspectResearchService,
} from "@/application/growth/growth-graph-matching-service";
import { GrowthScoringService } from "@/application/growth/growth-scoring-service";
import { GrowthReportService } from "@/application/growth/growth-report-service";
import type { GraphService } from "@/application/graph/graph-service";

export class GrowthJobRunner {
  constructor(
    private readonly graph: GraphService,
    private readonly gapAnalyzer = new GrowthGapAnalyzer(),
    private readonly research = new ProspectResearchService(),
    private readonly graphMatch = new GrowthGraphMatchingService(),
    private readonly scoring = new GrowthScoringService(),
    private readonly reports = new GrowthReportService(),
  ) {}

  async enqueue(jobType: GrowthJobType, payload: Record<string, unknown> = {}) {
    return prisma.growthJob.create({
      data: {
        jobType,
        payload: payload as Prisma.InputJsonValue,
        status: "PENDING",
      },
    });
  }

  async processNext(limit = 5): Promise<number> {
    const jobs = await prisma.growthJob.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    for (const job of jobs) {
      await prisma.growthJob.update({
        where: { id: job.id },
        data: { status: "RUNNING", startedAt: new Date() },
      });
      try {
        const result = await this.runJob(job.jobType, job.payload as Record<string, unknown>);
        await prisma.growthJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            result: result as Prisma.InputJsonValue,
          },
        });
      } catch (err) {
        await prisma.growthJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            error: err instanceof Error ? err.message : "unknown",
          },
        });
      }
    }
    return jobs.length;
  }

  private async runJob(
    jobType: GrowthJobType,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    switch (jobType) {
      case "OPPORTUNITY_ANALYSIS":
        return { count: await this.gapAnalyzer.persistOpportunities() };
      case "RESEARCH": {
        const prospectId = String(payload.prospectId ?? "");
        await this.research.researchProspect(prospectId);
        return { prospectId };
      }
      case "SCORE": {
        const prospectId = String(payload.prospectId ?? "");
        return this.scoreProspectById(prospectId);
      }
      case "REPORT_DAILY":
        return this.reports.buildDailyBrief();
      case "REPORT_WEEKLY":
        return this.reports.buildWeeklyReport();
      default:
        return { skipped: true };
    }
  }

  async scoreProspectById(prospectId: string) {
    const prospect = await prisma.growthProspect.findUnique({
      where: { id: prospectId },
    });
    if (!prospect) return null;

    const match = await this.graphMatch.matchProspect({
      skills: prospect.skills,
      topics: prospect.topics,
      industry: prospect.industry,
      profession: prospect.profession,
    });

    const lookalike = prospect.profession ? 55 : 40;
    const referralBoost =
      prospect.source === "REFERRAL" ? 75 : prospect.acquisitionSource === "Referral" ? 70 : 0;

    const scores = this.scoring.scoreProspect({
      skills: prospect.skills,
      topics: prospect.topics,
      profession: prospect.profession,
      portfolioUrl: prospect.portfolioUrl,
      website: prospect.website,
      publicSignals: prospect.publicSignals as Record<string, unknown>,
      experienceYears: prospect.experienceYears,
      demandScore: match.demandScore,
      networkGapScore: match.networkGapScore,
      lookalikeScore: lookalike,
      referralBoost,
    });

    const updated = await prisma.growthProspect.update({
      where: { id: prospectId },
      data: {
        smitviFitScore: scores.smitviFitScore,
        creatorPotentialScore: scores.creatorPotentialScore,
        monetizationPotentialScore: scores.monetizationPotentialScore,
        networkValueScore: scores.networkValueScore,
        overallGrowthScore: scores.overallGrowthScore,
        scoreBreakdown: scores.breakdown as Prisma.InputJsonValue,
        status:
          scores.overallGrowthScore >= 60 ? "QUALIFIED" : prospect.status,
      },
    });

    return { prospect: updated, graphMatch: match };
  }
}

export class GrowthAgentService {
  constructor(
    private readonly graph: GraphService,
    private readonly gapAnalyzer = new GrowthGapAnalyzer(),
    private readonly jobRunner: GrowthJobRunner,
    private readonly graphMatch = new GrowthGraphMatchingService(),
  ) {}

  static create(graph: GraphService) {
    const runner = new GrowthJobRunner(graph);
    return new GrowthAgentService(graph, new GrowthGapAnalyzer(), runner);
  }

  async getOverview() {
    const [opportunities, prospects, pendingMessages, brief] = await Promise.all([
      prisma.growthOpportunity.findMany({
        orderBy: { opportunityScore: "desc" },
        take: 10,
      }),
      prisma.growthProspect.count(),
      prisma.growthMessage.count({
        where: { approvalStatus: "PENDING_REVIEW" },
      }),
      prisma.growthReport.findFirst({
        where: { kind: "daily" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      opportunityCount: opportunities.length,
      topOpportunities: opportunities,
      totalProspects: prospects,
      pendingMessageReviews: pendingMessages,
      lastDailyBrief: brief?.payload ?? null,
    };
  }

  async analyzeOpportunities(days = 30) {
    return this.gapAnalyzer.analyze(days);
  }

  async refreshOpportunities() {
    const count = await this.gapAnalyzer.persistOpportunities();
    return { persisted: count };
  }

  findLookalikeProspects(limit = 20) {
    return this.graphMatch.findLookalikeProspects(limit);
  }

  researchProspect(prospectId: string) {
    return this.jobRunner.enqueue("RESEARCH", { prospectId });
  }

  scoreProspect(prospectId: string) {
    return this.jobRunner.enqueue("SCORE", { prospectId });
  }

  processJobs(limit = 5) {
    return this.jobRunner.processNext(limit);
  }
}
