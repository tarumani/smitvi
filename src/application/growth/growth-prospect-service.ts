import type { Prisma } from "@/generated/prisma/client";
import type {
  GrowthProspectSource,
  GrowthProspectStatus,
} from "@/generated/prisma/client";
import { ValidationError } from "@/domain/shared/errors";
import { prisma } from "@/infrastructure/database/prisma";
import {
  GrowthSuppressionService,
  normalizeEmail,
  normalizeProspectUrl,
} from "@/application/growth/growth-suppression-service";

export type CreateProspectInput = {
  name: string;
  professionalTitle?: string | null;
  profession?: string | null;
  company?: string | null;
  website?: string | null;
  portfolioUrl?: string | null;
  publicProfileUrl?: string | null;
  email?: string | null;
  source?: GrowthProspectSource;
  sourceUrl?: string | null;
  location?: string | null;
  country?: string | null;
  industry?: string | null;
  skills?: string[];
  topics?: string[];
  experienceYears?: number | null;
  publicSignals?: Record<string, unknown>;
  campaignId?: string | null;
  acquisitionSource?: string | null;
};

export function dedupeKey(input: {
  email?: string | null;
  publicProfileUrl?: string | null;
  portfolioUrl?: string | null;
  website?: string | null;
}): string | null {
  return (
    normalizeEmail(input.email) ??
    normalizeProspectUrl(input.publicProfileUrl) ??
    normalizeProspectUrl(input.portfolioUrl) ??
    normalizeProspectUrl(input.website)
  );
}

export class GrowthProspectService {
  constructor(
    private readonly suppression = new GrowthSuppressionService(),
  ) {}

  async list(input: {
    status?: GrowthProspectStatus;
    campaignId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const limit = Math.min(input.limit ?? 50, 100);
    const rows = await prisma.growthProspect.findMany({
      where: {
        status: input.status,
        campaignId: input.campaignId,
        doNotContact: false,
      },
      orderBy: [{ overallGrowthScore: "desc" }, { updatedAt: "desc" }],
      take: limit + 1,
      ...(input.cursor
        ? { cursor: { id: input.cursor }, skip: 1 }
        : {}),
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });
    const nextCursor = rows.length > limit ? rows[limit - 1]?.id : null;
    return { prospects: rows.slice(0, limit), nextCursor };
  }

  async getById(id: string) {
    return prisma.growthProspect.findUnique({
      where: { id },
      include: {
        research: { orderBy: { createdAt: "desc" }, take: 3 },
        messages: { orderBy: { createdAt: "desc" }, take: 5 },
        conversions: true,
        campaign: true,
      },
    });
  }

  async create(input: CreateProspectInput) {
    const suppressed = await this.suppression.isSuppressed({
      email: input.email,
      url: input.publicProfileUrl ?? input.portfolioUrl ?? input.website,
    });
    if (suppressed) {
      throw new ValidationError("Prospect is on suppression list");
    }

    const key = dedupeKey(input);
    if (key) {
      const or: Prisma.GrowthProspectWhereInput[] = [];
      const normalizedEmail = normalizeEmail(input.email);
      if (normalizedEmail) or.push({ email: normalizedEmail });
      const profileUrl = normalizeProspectUrl(input.publicProfileUrl);
      if (profileUrl) or.push({ publicProfileUrl: profileUrl });
      if (or.length > 0) {
        const existing = await prisma.growthProspect.findFirst({
          where: { OR: or },
        });
        if (existing) return { prospect: existing, duplicate: true as const };
      }
    }

    const prospect = await prisma.growthProspect.create({
      data: {
        name: input.name.trim().slice(0, 160),
        professionalTitle: input.professionalTitle?.slice(0, 160),
        profession: input.profession?.slice(0, 120),
        company: input.company?.slice(0, 160),
        website: input.website?.slice(0, 500),
        portfolioUrl: input.portfolioUrl?.slice(0, 500),
        publicProfileUrl: input.publicProfileUrl?.slice(0, 500),
        email: normalizeEmail(input.email),
        source: input.source ?? "MANUAL",
        sourceUrl: input.sourceUrl?.slice(0, 500),
        location: input.location?.slice(0, 120),
        country: input.country?.slice(0, 2)?.toUpperCase(),
        industry: input.industry?.slice(0, 120),
        skills: input.skills ?? [],
        topics: input.topics ?? [],
        experienceYears: input.experienceYears,
        publicSignals: (input.publicSignals ?? {}) as Prisma.InputJsonValue,
        campaignId: input.campaignId,
        acquisitionSource: input.acquisitionSource?.slice(0, 32),
        status: "DISCOVERED",
      },
    });
    return { prospect, duplicate: false as const };
  }

  async importCsvRows(
    rows: CreateProspectInput[],
    campaignId?: string | null,
  ): Promise<{ created: number; duplicates: number; skipped: number }> {
    let created = 0;
    let duplicates = 0;
    let skipped = 0;
    for (const row of rows.slice(0, 500)) {
      try {
        const result = await this.create({
          ...row,
          source: "CSV_IMPORT",
          campaignId: campaignId ?? row.campaignId,
        });
        if (result.duplicate) duplicates += 1;
        else created += 1;
      } catch {
        skipped += 1;
      }
    }
    return { created, duplicates, skipped };
  }

  async updateStatus(id: string, status: GrowthProspectStatus) {
    return prisma.growthProspect.update({
      where: { id },
      data: { status },
    });
  }

  async markDoNotContact(id: string) {
    await prisma.growthSuppressionEntry.create({
      data: {
        email: (
          await prisma.growthProspect.findUnique({ where: { id } })
        )?.email,
        reason: "do_not_contact",
      },
    });
    return prisma.growthProspect.update({
      where: { id },
      data: { doNotContact: true, status: "DO_NOT_CONTACT" },
    });
  }
}
