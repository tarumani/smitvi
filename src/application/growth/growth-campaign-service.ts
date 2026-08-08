import type { GrowthCampaignStatus } from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export class GrowthCampaignService {
  async list(status?: GrowthCampaignStatus) {
    return prisma.growthCampaign.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { prospects: true } },
      },
    });
  }

  async create(input: {
    name: string;
    description?: string | null;
    targetProfession?: string | null;
    targetSkills?: string[];
    targetIndustries?: string[];
    targetLocations?: string[];
    goal?: string | null;
    createdByUserId?: string | null;
  }) {
    return prisma.growthCampaign.create({
      data: {
        name: input.name.slice(0, 160),
        description: input.description,
        targetProfession: input.targetProfession?.slice(0, 120),
        targetSkills: input.targetSkills ?? [],
        targetIndustries: input.targetIndustries ?? [],
        targetLocations: input.targetLocations ?? [],
        goal: input.goal?.slice(0, 240),
        createdByUserId: input.createdByUserId,
        status: "DRAFT",
      },
    });
  }
}
