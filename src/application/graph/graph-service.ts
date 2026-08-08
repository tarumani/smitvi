import { ForbiddenError, NotFoundError } from "@/domain/shared/errors";
import type { GraphEntityType } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import type {
  GraphEntityRow,
  GraphRelationshipRow,
  PrismaGraphRepository,
} from "@/infrastructure/database/repositories/graph-repository";
import {
  normalizeEntityName,
  resolveAliasKey,
  slugifyEntityName,
} from "@/domain/graph/normalize";
import type { GraphRelationshipTypeCode } from "@/domain/graph/constants";

export type CreateEntityInput = {
  entityType: GraphEntityType;
  name: string;
  description?: string | null;
  ownerUserId?: string | null;
  visibility?: "PUBLIC" | "PRIVATE" | "FOLLOWERS" | "CONNECTIONS";
  metadata?: Record<string, unknown>;
  aliasSource?: "USER" | "AI" | "IMPORT" | "ADMIN";
};

export type CreateRelationshipInput = {
  sourceEntityId: string;
  relationshipType: GraphRelationshipTypeCode | string;
  targetEntityId: string;
  confidenceScore?: number;
  source: "USER" | "AI" | "PROFILE" | "IMPORT" | "ADMIN";
  verified?: boolean;
  verificationStatus?: "PENDING" | "AI_DETECTED" | "USER_VERIFIED" | "USER_REJECTED" | "HIDDEN";
  metadata?: Record<string, unknown>;
  evidence?: {
    sourceType: "KNOWLEDGE_SOURCE" | "KNOWLEDGE_CHUNK" | "PROFILE_FIELD" | "USER_ASSERTION" | "ADMIN";
    sourceId: string;
    contentReference?: string | null;
    contentExcerpt?: string | null;
    confidence: number;
  };
};

export type UserGraphDto = {
  userEntity: GraphEntityRow | null;
  skills: Array<{ entity: GraphEntityRow; relationship: GraphRelationshipRow }>;
  expertise: Array<{ entity: GraphEntityRow; relationship: GraphRelationshipRow }>;
  topics: Array<{ entity: GraphEntityRow; relationship: GraphRelationshipRow }>;
  technologies: Array<{ entity: GraphEntityRow; relationship: GraphRelationshipRow }>;
  tools: Array<{ entity: GraphEntityRow; relationship: GraphRelationshipRow }>;
  companies: Array<{ entity: GraphEntityRow; relationship: GraphRelationshipRow }>;
  projects: Array<{ entity: GraphEntityRow; relationship: GraphRelationshipRow }>;
  industries: Array<{ entity: GraphEntityRow; relationship: GraphRelationshipRow }>;
  pending: GraphRelationshipRow[];
};

export class GraphService {
  constructor(private readonly repo: PrismaGraphRepository) {}

  async createEntity(input: CreateEntityInput): Promise<GraphEntityRow> {
    const canonicalName = input.name.trim();
    const slug = slugifyEntityName(canonicalName);
    const normalized = normalizeEntityName(canonicalName);
    const ownerUserId = input.ownerUserId ?? null;

    const existing = await this.resolveEntity({
      entityType: input.entityType,
      name: canonicalName,
      ownerUserId,
    });
    if (existing) return existing;

    return this.repo.createEntity({
      entityType: input.entityType,
      canonicalName,
      slug,
      description: input.description,
      ownerUserId,
      visibility: input.visibility ?? (ownerUserId ? "PRIVATE" : "PUBLIC"),
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      aliases: [
        {
          alias: canonicalName,
          normalizedAlias: resolveAliasKey(normalized),
          source: input.aliasSource ?? "USER",
        },
      ],
    });
  }

  async findEntity(
    entityType: GraphEntityType,
    slug: string,
    ownerUserId: string | null,
  ): Promise<GraphEntityRow | null> {
    return this.repo.findEntityBySlugScope({ entityType, slug, ownerUserId });
  }

  async resolveEntity(input: {
    entityType: GraphEntityType;
    name: string;
    ownerUserId?: string | null;
  }): Promise<GraphEntityRow | null> {
    const ownerUserId = input.ownerUserId ?? null;
    const slug = slugifyEntityName(input.name);
    const normalized = resolveAliasKey(normalizeEntityName(input.name));

    const bySlug = await this.repo.findEntityBySlugScope({
      entityType: input.entityType,
      slug,
      ownerUserId,
    });
    if (bySlug) return bySlug;

    return this.repo.findEntityByNormalizedAlias({
      entityType: input.entityType,
      normalizedAlias: normalized,
      ownerUserId,
    });
  }

  async getEntity(id: string): Promise<GraphEntityRow | null> {
    return this.repo.findEntityById(id);
  }

  async ensureUserEntity(
    userId: string,
    displayName: string,
  ): Promise<GraphEntityRow> {
    const existing = await this.repo.findEntityByLinkedUserId(userId);
    if (existing) return existing;

    const slug = slugifyEntityName(displayName || userId.slice(0, 8));
    try {
      return await this.repo.createEntity({
        entityType: "USER",
        canonicalName: displayName || "User",
        slug: `user-${slug}`,
        linkedUserId: userId,
        ownerUserId: userId,
        visibility: "PRIVATE",
        metadata: { userId },
        aliases: [
          {
            alias: displayName || userId,
            normalizedAlias: normalizeEntityName(displayName || userId),
            source: "USER",
          },
        ],
      });
    } catch {
      const again = await this.repo.findEntityByLinkedUserId(userId);
      if (again) return again;
      throw new Error("Failed to create user graph entity");
    }
  }

  async createRelationship(
    input: CreateRelationshipInput,
  ): Promise<GraphRelationshipRow> {
    const existing = await this.repo.findActiveRelationship({
      sourceEntityId: input.sourceEntityId,
      relationshipType: input.relationshipType,
      targetEntityId: input.targetEntityId,
    });
    if (existing) {
      if (input.evidence) {
        await this.repo.createEvidence({
          relationshipId: existing.id,
          ...input.evidence,
        });
      }
      return existing;
    }

    let evidenceId: string | null = null;
    if (input.evidence) {
      const ev = await this.repo.createEvidence(input.evidence);
      evidenceId = ev.id;
    }

    return this.repo.createRelationship({
      sourceEntityId: input.sourceEntityId,
      relationshipType: input.relationshipType,
      targetEntityId: input.targetEntityId,
      confidenceScore: input.confidenceScore ?? 1,
      verified: input.verified ?? false,
      verificationStatus:
        input.verificationStatus ??
        (input.source === "AI"
          ? "AI_DETECTED"
          : input.verified
            ? "USER_VERIFIED"
            : "PENDING"),
      source: input.source,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      evidenceId,
    });
  }

  async findRelationship(
    sourceEntityId: string,
    relationshipType: string,
    targetEntityId: string,
  ): Promise<GraphRelationshipRow | null> {
    return this.repo.findActiveRelationship({
      sourceEntityId,
      relationshipType,
      targetEntityId,
    });
  }

  async createEvidence(
    relationshipId: string,
    data: CreateRelationshipInput["evidence"],
  ) {
    if (!data) throw new Error("Evidence payload required");
    return this.repo.createEvidence({ relationshipId, ...data });
  }

  async deleteRelationship(id: string, actorUserId: string): Promise<boolean> {
    const rel = await this.repo.getRelationshipById(id);
    if (!rel) return false;
    await this.assertCanMutateRelationship(rel, actorUserId);
    return this.repo.softDeleteRelationship(id);
  }

  async updateRelationshipConfidence(
    id: string,
    confidenceScore: number,
    actorUserId: string,
  ): Promise<GraphRelationshipRow | null> {
    const rel = await this.repo.getRelationshipById(id);
    if (!rel) return null;
    await this.assertCanMutateRelationship(rel, actorUserId);
    return this.repo.updateRelationship(id, { confidenceScore });
  }

  async updateRelationshipVerification(
    id: string,
    actorUserId: string,
    status: "USER_VERIFIED" | "USER_REJECTED" | "HIDDEN" | "AI_DETECTED" | "PENDING",
  ): Promise<GraphRelationshipRow | null> {
    const rel = await this.repo.getRelationshipById(id);
    if (!rel) return null;
    await this.assertCanMutateRelationship(rel, actorUserId);
    return this.repo.updateRelationship(id, {
      verificationStatus: status,
      verified: status === "USER_VERIFIED",
    });
  }

  async getUserGraph(
    targetUserId: string,
    viewerUserId: string | null,
  ): Promise<UserGraphDto> {
    const isOwner = viewerUserId === targetUserId;
    const userEntity = await this.repo.findEntityByLinkedUserId(targetUserId);
    if (!userEntity) {
      return emptyUserGraph(null);
    }

    if (!isOwner) {
      await this.assertCanViewUserGraph(targetUserId, viewerUserId);
    }

    const edges = await this.repo.listOutgoingRelationships(userEntity.id, {
      includeHidden: isOwner,
    });

    const filtered = edges.filter((edge) => {
      if (isOwner) return edge.verificationStatus !== "USER_REJECTED";
      if (edge.verificationStatus === "USER_REJECTED" || edge.verificationStatus === "HIDDEN") {
        return false;
      }
      if (edge.verificationStatus === "USER_VERIFIED") return true;
      if (edge.source === "PROFILE" || edge.source === "USER") return true;
      return edge.confidenceScore >= 0.65;
    });

    const bucket = (
      types: string[],
      entityTypes?: GraphEntityType[],
    ): Array<{ entity: GraphEntityRow; relationship: GraphRelationshipRow }> =>
      filtered
        .filter(
          (e) =>
            types.includes(e.relationshipType) &&
            e.targetEntity &&
            (!entityTypes?.length ||
              entityTypes.includes(e.targetEntity.entityType)),
        )
        .map((e) => ({
          entity: e.targetEntity!,
          relationship: e,
        }));

    const pending = isOwner
      ? filtered.filter(
          (e) =>
            e.verificationStatus === "AI_DETECTED" ||
            e.verificationStatus === "PENDING",
        )
      : [];

    return {
      userEntity,
      skills: bucket(["USER_HAS_SKILL"], ["SKILL"]),
      expertise: bucket(["USER_HAS_EXPERTISE"]),
      topics: bucket(["USER_INTERESTED_IN"], ["TOPIC"]),
      technologies: bucket(["USER_USES_TECHNOLOGY"], ["TECHNOLOGY"]),
      tools: bucket(["USER_USES_TOOL"], ["TOOL"]),
      companies: bucket(["USER_WORKED_AT"], ["COMPANY"]),
      projects: bucket(["USER_CREATED_PROJECT"], ["PROJECT"]),
      industries: bucket(["USER_WORKS_IN_INDUSTRY"], ["INDUSTRY"]),
      pending,
    };
  }

  async getRelatedEntities(entityId: string, relationshipType?: string) {
    const edges = await this.repo.listOutgoingRelationships(entityId, {
      relationshipTypes: relationshipType ? [relationshipType] : undefined,
    });
    return edges
      .map((e) => e.targetEntity)
      .filter((e): e is GraphEntityRow => Boolean(e));
  }

  async getNeighbors(entityId: string, depth = 1) {
    return this.repo.neighbors(entityId, depth);
  }

  async getGraphPath(
    fromEntityId: string,
    toEntityId: string,
    maxDepth = 4,
  ): Promise<string[][]> {
    const paths: string[][] = [];
    const queue: { id: string; path: string[] }[] = [
      { id: fromEntityId, path: [fromEntityId] },
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.path.length > maxDepth) continue;
      if (current.id === toEntityId && current.path.length > 1) {
        paths.push(current.path);
        continue;
      }
      const key = `${current.id}:${current.path.length}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const neighbors = await this.repo.neighbors(current.id, 1);
      for (const n of neighbors) {
        if (current.path.includes(n.entity.id)) continue;
        queue.push({
          id: n.entity.id,
          path: [...current.path, n.entity.id],
        });
      }
    }
    return paths.slice(0, 10);
  }

  async assertEntityVisibleToViewer(
    entity: GraphEntityRow,
    viewerUserId: string | null,
  ): Promise<void> {
    if (entity.ownerUserId === viewerUserId || entity.linkedUserId === viewerUserId) {
      return;
    }
    if (entity.visibility === "PUBLIC" && entity.status === "ACTIVE") {
      return;
    }
    throw new ForbiddenError("Graph entity is not visible");
  }

  private async assertCanViewUserGraph(
    targetUserId: string,
    viewerUserId: string | null,
  ): Promise<void> {
    const profile = await this.repo.findProfileForGraphSync(targetUserId);
    if (!profile) throw new NotFoundError("Profile not found");
    if (profile.visibility === "PUBLIC") return;
    if (!viewerUserId) throw new ForbiddenError("Sign in to view this graph");
    if (profile.userId === viewerUserId) return;
    throw new ForbiddenError("This intelligence graph is private");
  }

  private async assertCanMutateRelationship(
    rel: {
      sourceEntity: GraphEntityRow;
    },
    actorUserId: string,
  ): Promise<void> {
    const ownerId =
      rel.sourceEntity.linkedUserId ?? rel.sourceEntity.ownerUserId;
    if (ownerId !== actorUserId) {
      throw new ForbiddenError("Not allowed to modify this relationship");
    }
  }
}

function emptyUserGraph(userEntity: GraphEntityRow | null): UserGraphDto {
  return {
    userEntity,
    skills: [],
    expertise: [],
    topics: [],
    technologies: [],
    tools: [],
    companies: [],
    projects: [],
    industries: [],
    pending: [],
  };
}
