import type {
  GraphAliasSource,
  GraphEntityStatus,
  GraphEntityType,
  GraphEvidenceSourceType,
  GraphProcessingJobStatus,
  GraphProcessingJobType,
  GraphRelationshipSource,
  GraphVerificationStatus,
  GraphVisibility,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export type GraphEntityRow = {
  id: string;
  entityType: GraphEntityType;
  canonicalName: string;
  slug: string;
  description: string | null;
  metadata: Prisma.JsonValue;
  ownerUserId: string | null;
  linkedUserId: string | null;
  skillId: string | null;
  visibility: GraphVisibility;
  status: GraphEntityStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type GraphRelationshipRow = {
  id: string;
  sourceEntityId: string;
  relationshipType: string;
  targetEntityId: string;
  confidenceScore: number;
  weight: number | null;
  verified: boolean;
  verificationStatus: GraphVerificationStatus;
  source: GraphRelationshipSource;
  metadata: Prisma.JsonValue;
  status: GraphEntityStatus;
  createdAt: Date;
  updatedAt: Date;
  targetEntity?: GraphEntityRow;
  sourceEntity?: GraphEntityRow;
  evidence?: {
    id: string;
    sourceType: GraphEvidenceSourceType;
    sourceId: string;
    contentReference: string | null;
    contentExcerpt: string | null;
    confidence: number;
  } | null;
};

const entitySelect = {
  id: true,
  entityType: true,
  canonicalName: true,
  slug: true,
  description: true,
  metadata: true,
  ownerUserId: true,
  linkedUserId: true,
  skillId: true,
  visibility: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class PrismaGraphRepository {
  async findEntityById(id: string): Promise<GraphEntityRow | null> {
    return prisma.graphEntity.findFirst({
      where: { id, deletedAt: null, status: "ACTIVE" },
      select: entitySelect,
    });
  }

  async findEntityByLinkedUserId(
    userId: string,
  ): Promise<GraphEntityRow | null> {
    return prisma.graphEntity.findFirst({
      where: {
        linkedUserId: userId,
        entityType: "USER",
        deletedAt: null,
        status: "ACTIVE",
      },
      select: entitySelect,
    });
  }

  async findEntityBySkillId(skillId: string): Promise<GraphEntityRow | null> {
    return prisma.graphEntity.findFirst({
      where: { skillId, deletedAt: null, status: "ACTIVE" },
      select: entitySelect,
    });
  }

  async findEntityBySlugScope(input: {
    entityType: GraphEntityType;
    slug: string;
    ownerUserId: string | null;
  }): Promise<GraphEntityRow | null> {
    return prisma.graphEntity.findFirst({
      where: {
        entityType: input.entityType,
        slug: input.slug,
        ownerUserId: input.ownerUserId,
        deletedAt: null,
        status: "ACTIVE",
      },
      select: entitySelect,
    });
  }

  async findEntityByNormalizedAlias(input: {
    entityType: GraphEntityType;
    normalizedAlias: string;
    ownerUserId: string | null;
  }): Promise<GraphEntityRow | null> {
    const alias = await prisma.graphEntityAlias.findFirst({
      where: {
        normalizedAlias: input.normalizedAlias,
        entity: {
          entityType: input.entityType,
          ownerUserId: input.ownerUserId,
          deletedAt: null,
          status: "ACTIVE",
        },
      },
      include: { entity: { select: entitySelect } },
    });
    return alias?.entity ?? null;
  }

  async createEntity(data: {
    entityType: GraphEntityType;
    canonicalName: string;
    slug: string;
    description?: string | null;
    metadata?: Prisma.InputJsonValue;
    ownerUserId?: string | null;
    linkedUserId?: string | null;
    skillId?: string | null;
    visibility?: GraphVisibility;
    aliases?: Array<{ alias: string; normalizedAlias: string; source: GraphAliasSource }>;
  }): Promise<GraphEntityRow> {
    return prisma.graphEntity.create({
      data: {
        entityType: data.entityType,
        canonicalName: data.canonicalName,
        slug: data.slug,
        description: data.description ?? null,
        metadata: data.metadata ?? {},
        ownerUserId: data.ownerUserId ?? null,
        linkedUserId: data.linkedUserId ?? null,
        skillId: data.skillId ?? null,
        visibility: data.visibility ?? "PRIVATE",
        aliases: data.aliases?.length
          ? {
              create: data.aliases.map((a) => ({
                alias: a.alias,
                normalizedAlias: a.normalizedAlias,
                source: a.source,
              })),
            }
          : undefined,
      },
      select: entitySelect,
    });
  }

  async upsertAlias(
    entityId: string,
    alias: string,
    normalizedAlias: string,
    source: GraphAliasSource,
  ): Promise<void> {
    await prisma.graphEntityAlias.upsert({
      where: {
        entityId_normalizedAlias: { entityId, normalizedAlias },
      },
      create: { entityId, alias, normalizedAlias, source },
      update: { alias },
    });
  }

  async findActiveRelationship(input: {
    sourceEntityId: string;
    relationshipType: string;
    targetEntityId: string;
  }): Promise<GraphRelationshipRow | null> {
    return prisma.graphRelationship.findFirst({
      where: {
        sourceEntityId: input.sourceEntityId,
        relationshipType: input.relationshipType,
        targetEntityId: input.targetEntityId,
        status: "ACTIVE",
        deletedAt: null,
      },
      include: {
        evidence: {
          select: {
            id: true,
            sourceType: true,
            sourceId: true,
            contentReference: true,
            contentExcerpt: true,
            confidence: true,
          },
        },
      },
    });
  }

  async createEvidence(data: {
    entityId?: string | null;
    relationshipId?: string | null;
    sourceType: GraphEvidenceSourceType;
    sourceId: string;
    contentReference?: string | null;
    contentExcerpt?: string | null;
    pageNumber?: number | null;
    confidence: number;
  }) {
    return prisma.graphEvidence.create({ data });
  }

  async createRelationship(data: {
    sourceEntityId: string;
    relationshipType: string;
    targetEntityId: string;
    confidenceScore: number;
    weight?: number | null;
    verified?: boolean;
    verificationStatus?: GraphVerificationStatus;
    source: GraphRelationshipSource;
    metadata?: Prisma.InputJsonValue;
    evidenceId?: string | null;
  }): Promise<GraphRelationshipRow> {
    return prisma.graphRelationship.create({
      data: {
        sourceEntityId: data.sourceEntityId,
        relationshipType: data.relationshipType,
        targetEntityId: data.targetEntityId,
        confidenceScore: data.confidenceScore,
        weight: data.weight ?? null,
        verified: data.verified ?? false,
        verificationStatus: data.verificationStatus ?? "PENDING",
        source: data.source,
        metadata: data.metadata ?? {},
        evidenceId: data.evidenceId ?? null,
      },
      include: {
        evidence: {
          select: {
            id: true,
            sourceType: true,
            sourceId: true,
            contentReference: true,
            contentExcerpt: true,
            confidence: true,
          },
        },
      },
    });
  }

  async updateRelationship(
    id: string,
    data: Partial<{
      confidenceScore: number;
      verified: boolean;
      verificationStatus: GraphVerificationStatus;
      verificationSource: string | null;
      status: GraphEntityStatus;
      deletedAt: Date | null;
      metadata: Prisma.InputJsonValue;
    }>,
  ): Promise<GraphRelationshipRow | null> {
    try {
      return await prisma.graphRelationship.update({
        where: { id },
        data,
        include: {
          evidence: {
            select: {
              id: true,
              sourceType: true,
              sourceId: true,
              contentReference: true,
              contentExcerpt: true,
              confidence: true,
            },
          },
        },
      });
    } catch {
      return null;
    }
  }

  async softDeleteRelationship(id: string): Promise<boolean> {
    const result = await prisma.graphRelationship.updateMany({
      where: { id, status: "ACTIVE" },
      data: { status: "REMOVED", deletedAt: new Date() },
    });
    return result.count > 0;
  }

  async listOutgoingRelationships(
    sourceEntityId: string,
    options?: { relationshipTypes?: string[]; includeHidden?: boolean },
  ): Promise<GraphRelationshipRow[]> {
    const verificationFilter =
      options?.includeHidden === true
        ? undefined
        : { not: "HIDDEN" as GraphVerificationStatus };

    return prisma.graphRelationship.findMany({
      where: {
        sourceEntityId,
        status: "ACTIVE",
        deletedAt: null,
        verificationStatus: verificationFilter,
        ...(options?.relationshipTypes?.length
          ? { relationshipType: { in: options.relationshipTypes } }
          : {}),
      },
      include: {
        targetEntity: { select: entitySelect },
        evidence: {
          select: {
            id: true,
            sourceType: true,
            sourceId: true,
            contentReference: true,
            contentExcerpt: true,
            confidence: true,
          },
        },
      },
      orderBy: { confidenceScore: "desc" },
    });
  }

  async getRelationshipById(id: string): Promise<
    | (GraphRelationshipRow & {
        sourceEntity: GraphEntityRow;
        targetEntity: GraphEntityRow;
      })
    | null
  > {
    return prisma.graphRelationship.findFirst({
      where: { id, deletedAt: null },
      include: {
        sourceEntity: { select: entitySelect },
        targetEntity: { select: entitySelect },
        evidence: {
          select: {
            id: true,
            sourceType: true,
            sourceId: true,
            contentReference: true,
            contentExcerpt: true,
            confidence: true,
          },
        },
      },
    });
  }

  async linkEntityToKnowledgeSource(
    entityId: string,
    knowledgeSourceId: string,
  ): Promise<void> {
    await prisma.graphEntitySource.upsert({
      where: {
        entityId_knowledgeSourceId: { entityId, knowledgeSourceId },
      },
      create: { entityId, knowledgeSourceId },
      update: {},
    });
  }

  async createProcessingJob(input: {
    userId: string;
    jobType: GraphProcessingJobType;
    payload?: Prisma.InputJsonValue;
  }) {
    return prisma.graphProcessingJob.create({
      data: {
        userId: input.userId,
        jobType: input.jobType,
        payload: input.payload ?? {},
      },
    });
  }

  async claimNextJob(): Promise<{
    id: string;
    userId: string;
    jobType: GraphProcessingJobType;
    payload: Prisma.JsonValue;
    attempts: number;
  } | null> {
    const job = await prisma.graphProcessingJob.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    if (!job) return null;

    const updated = await prisma.graphProcessingJob.updateMany({
      where: { id: job.id, status: "PENDING" },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
    if (updated.count === 0) return null;

    return {
      id: job.id,
      userId: job.userId,
      jobType: job.jobType,
      payload: job.payload,
      attempts: job.attempts + 1,
    };
  }

  async completeJob(
    id: string,
    status: GraphProcessingJobStatus,
    errorMessage?: string | null,
  ): Promise<void> {
    await prisma.graphProcessingJob.update({
      where: { id },
      data: {
        status,
        errorMessage: errorMessage ?? null,
        completedAt: new Date(),
      },
    });
  }

  async findJobById(id: string) {
    return prisma.graphProcessingJob.findUnique({ where: { id } });
  }

  async markJobProcessing(id: string): Promise<boolean> {
    const updated = await prisma.graphProcessingJob.updateMany({
      where: { id, status: "PENDING" },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
    return updated.count > 0;
  }

  async neighbors(
    entityId: string,
    depth: number,
  ): Promise<{ entity: GraphEntityRow; via: string }[]> {
    if (depth <= 0) return [];
    const edges = await prisma.graphRelationship.findMany({
      where: {
        OR: [{ sourceEntityId: entityId }, { targetEntityId: entityId }],
        status: "ACTIVE",
        deletedAt: null,
        verificationStatus: { not: "USER_REJECTED" },
      },
      include: {
        sourceEntity: { select: entitySelect },
        targetEntity: { select: entitySelect },
      },
      take: 100,
    });

    const out: { entity: GraphEntityRow; via: string }[] = [];
    for (const edge of edges) {
      const other =
        edge.sourceEntityId === entityId
          ? edge.targetEntity
          : edge.sourceEntity;
      if (other && other.id !== entityId) {
        out.push({ entity: other, via: edge.relationshipType });
      }
    }
    return out;
  }

  async findProfileForGraphSync(userId: string) {
    return prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        experiences: { orderBy: { sortOrder: "asc" } },
        portfolio: { orderBy: { sortOrder: "asc" } },
        user: { select: { email: true } },
      },
    });
  }

  async listUserIdsWithProfiles(): Promise<string[]> {
    const rows = await prisma.profile.findMany({
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }
}
