import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import type { GraphService } from "@/application/graph/graph-service";
import { normalizeEntityName } from "@/domain/graph/normalize";

export type GraphMatchResult = {
  skillOverlap: string[];
  topicOverlap: string[];
  industryOverlap: string[];
  expertGapsFilled: string[];
  networkGaps: string[];
  potentialCollaborators: string[];
  demandScore: number;
  networkGapScore: number;
};

export class GrowthGraphMatchingService {
  constructor(_graph?: GraphService) {}

  async matchProspect(input: {
    skills: string[];
    topics: string[];
    industry?: string | null;
    profession?: string | null;
  }): Promise<GraphMatchResult> {
    const skillNorm = input.skills.map((s) => normalizeEntityName(s));
    const topicNorm = input.topics.map((t) => normalizeEntityName(t));

    const skillEntities = await prisma.graphEntity.findMany({
      where: {
        entityType: "SKILL",
        OR: skillNorm.map((n) => ({
          canonicalName: { contains: n.slice(0, 40), mode: "insensitive" as const },
        })),
      },
      take: 40,
    });

    const skillOverlap = skillEntities.map((e) => e.canonicalName);

    const expertCounts = await prisma.graphRelationship.groupBy({
      by: ["targetEntityId"],
      where: {
        targetEntityId: { in: skillEntities.map((e) => e.id) },
        relationshipType: { in: ["USER_HAS_SKILL", "USER_HAS_EXPERTISE"] },
      },
      _count: { id: true },
    });

    const countByEntity = new Map(
      expertCounts.map((r) => [r.targetEntityId, r._count.id]),
    );

    const networkGaps: string[] = [];
    for (const ent of skillEntities) {
      const c = countByEntity.get(ent.id) ?? 0;
      if (c <= 2) networkGaps.push(ent.canonicalName);
    }

    const demandScore =
      networkGaps.length === 0
        ? 45
        : Math.min(100, 55 + networkGaps.length * 8);
    const networkGapScore =
      networkGaps.length === 0
        ? 40
        : Math.min(100, 50 + networkGaps.length * 10);

    const collaborators = await prisma.profile.findMany({
      where: {
        isOnboarded: true,
        profession: input.profession
          ? { contains: input.profession.slice(0, 40), mode: "insensitive" }
          : undefined,
      },
      take: 5,
      select: { username: true, displayName: true },
    });

    return {
      skillOverlap,
      topicOverlap: topicNorm.slice(0, 10),
      industryOverlap: input.industry ? [input.industry] : [],
      expertGapsFilled: skillOverlap.filter((s) => networkGaps.includes(s)),
      networkGaps: networkGaps.slice(0, 12),
      potentialCollaborators: collaborators.map((c) => c.username),
      demandScore,
      networkGapScore,
    };
  }

  async findLookalikeProspects(limit = 20) {
    const topSellers = await prisma.marketplaceOrder.groupBy({
      by: ["sellerId"],
      where: { status: { in: ["PAID", "FULFILLED"] } },
      _sum: { netAmountCents: true },
      orderBy: { _sum: { netAmountCents: "desc" } },
      take: 5,
    });

    const sellerIds = topSellers.map((s) => s.sellerId);
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: sellerIds } },
      select: { userId: true, profession: true, username: true },
    });

    const traits = profiles
      .map((p) => p.profession)
      .filter(Boolean) as string[];

    const prospects = await prisma.growthProspect.findMany({
      where: {
        status: { in: ["DISCOVERED", "RESEARCHED", "QUALIFIED"] },
        OR: traits.map((t) => ({
          profession: { contains: t.slice(0, 40), mode: "insensitive" as const },
        })),
      },
      orderBy: { overallGrowthScore: "desc" },
      take: limit,
    });

    return { referenceCreators: profiles, prospects };
  }
}

export class ProspectResearchService {
  async researchProspect(prospectId: string): Promise<void> {
    const prospect = await prisma.growthProspect.findUnique({
      where: { id: prospectId },
    });
    if (!prospect) return;

    const evidence: Array<{
      claim: string;
      source: string;
      confidence: number;
    }> = [];

    if (prospect.profession) {
      evidence.push({
        claim: `Profession: ${prospect.profession}`,
        source: "prospect_record",
        confidence: 0.9,
      });
    } else {
      evidence.push({
        claim: "Profession: UNKNOWN",
        source: "prospect_record",
        confidence: 0,
      });
    }

    if (prospect.portfolioUrl) {
      evidence.push({
        claim: "Public portfolio URL provided",
        source: prospect.portfolioUrl,
        confidence: 0.85,
      });
    }

    for (const skill of prospect.skills.slice(0, 15)) {
      evidence.push({
        claim: `Skill: ${skill}`,
        source: "prospect_record",
        confidence: 0.8,
      });
    }

    const summaryParts = [
      prospect.profession
        ? `${prospect.name} works as ${prospect.profession}.`
        : `${prospect.name} — profession UNKNOWN.`,
      prospect.skills.length
        ? `Skills on record: ${prospect.skills.slice(0, 8).join(", ")}.`
        : "Skills: UNKNOWN.",
      prospect.portfolioUrl
        ? "Portfolio link available for human review."
        : "Portfolio: UNKNOWN.",
    ];

    await prisma.growthProspectResearch.create({
      data: {
        prospectId,
        summary: summaryParts.join(" "),
        evidence: evidence as Prisma.InputJsonValue,
        confidence: evidence.length ? 0.65 : 0.3,
        modelVersion: "deterministic-v1",
      },
    });

    await prisma.growthProspect.update({
      where: { id: prospectId },
      data: {
        status: "RESEARCHED",
        expertiseSummary: summaryParts.join(" "),
      },
    });
  }
}
