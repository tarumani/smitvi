import type { GraphEntityType } from "@/generated/prisma/client";
import type { InterpretedEntity } from "@/domain/search/types";
import { qualifiedPublicHubProfileWhere } from "@/domain/profile/qualified-public-hub";
import { prisma } from "@/infrastructure/database/prisma";

const TYPE_TO_REL: Partial<Record<GraphEntityType, string[]>> = {
  SKILL: ["USER_HAS_SKILL"],
  PROFESSION: ["USER_HAS_EXPERTISE"],
  INDUSTRY: ["USER_WORKS_IN_INDUSTRY"],
  TECHNOLOGY: ["USER_USES_TECHNOLOGY"],
  TOOL: ["USER_USES_TOOL"],
  PROJECT: ["USER_CREATED_PROJECT"],
  TOPIC: ["USER_INTERESTED_IN"],
  COMPANY: ["USER_WORKED_AT"],
};

export type GraphExpertCandidate = {
  userId: string;
  matchedEntityIds: string[];
  matchedTypes: GraphEntityType[];
};

export class GraphSearchRepository {
  async findUserIdsForEntityCriterion(input: {
    entityType: GraphEntityType;
    graphEntityId: string | null;
    name: string;
    relationshipTypes?: string[];
  }): Promise<Set<string>> {
    const relTypes =
      input.relationshipTypes ??
      TYPE_TO_REL[input.entityType] ??
      ["USER_HAS_SKILL"];

    if (input.graphEntityId) {
      return this.usersLinkedToTarget(input.graphEntityId, relTypes);
    }

    return this.usersLinkedToTargetByName(
      input.entityType,
      input.name,
      relTypes,
    );
  }

  async findExpertsByMultipleCriteria(
    entities: InterpretedEntity[],
  ): Promise<Map<string, GraphExpertCandidate>> {
    const required = entities.filter((e) => e.requirement === "REQUIRED");
    const optional = entities.filter((e) => e.requirement === "OPTIONAL");
    const orGroups = new Map<string, InterpretedEntity[]>();

    for (const e of entities.filter((x) => x.requirement === "OR")) {
      const g = e.orGroup ?? "default-or";
      orGroups.set(g, [...(orGroups.get(g) ?? []), e]);
    }

    let candidateMap = new Map<string, GraphExpertCandidate>();

    if (required.length === 0 && orGroups.size === 0 && optional.length > 0) {
      return this.unionCriteria(optional);
    }

    for (const ent of required) {
      const ids = await this.findUserIdsForEntityCriterion({
        entityType: ent.type as GraphEntityType,
        graphEntityId: ent.graphEntityId ?? null,
        name: ent.value,
      });
      candidateMap = intersectCandidates(candidateMap, ids, ent);
    }

    for (const [, group] of orGroups) {
      const orSet = new Map<string, GraphExpertCandidate>();
      for (const ent of group) {
        const ids = await this.findUserIdsForEntityCriterion({
          entityType: ent.type as GraphEntityType,
          graphEntityId: ent.graphEntityId ?? null,
          name: ent.value,
        });
        for (const uid of ids) {
          orSet.set(uid, mergeCandidate(orSet.get(uid), uid, ent));
        }
      }
      candidateMap =
        required.length === 0 && candidateMap.size === 0
          ? orSet
          : intersectWithOrGroup(candidateMap, orSet);
    }

    if (optional.length && candidateMap.size > 0) {
      await boostOptional(candidateMap, optional, this);
    }

    return candidateMap;
  }

  async getPublicUserGraphContext(userId: string) {
    const userEntity = await prisma.graphEntity.findFirst({
      where: { linkedUserId: userId, entityType: "USER", status: "ACTIVE" },
      select: { id: true },
    });
    if (!userEntity) return null;

    const edges = await prisma.graphRelationship.findMany({
      where: {
        sourceEntityId: userEntity.id,
        status: "ACTIVE",
        deletedAt: null,
        verificationStatus: { notIn: ["USER_REJECTED", "HIDDEN"] },
      },
      include: {
        targetEntity: {
          select: {
            entityType: true,
            canonicalName: true,
          },
        },
        evidence: {
          select: {
            sourceType: true,
            contentExcerpt: true,
            confidence: true,
          },
        },
      },
      take: 80,
    });

    return edges;
  }

  private async usersLinkedToTarget(
    targetEntityId: string,
    relationshipTypes: string[],
  ): Promise<Set<string>> {
    const rows = await prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT DISTINCT ge.linked_user_id AS user_id
      FROM graph_entities ge
      INNER JOIN graph_relationships gr ON gr.source_entity_id = ge.id
      INNER JOIN profiles p ON p.user_id = ge.linked_user_id
      WHERE ge.entity_type = 'USER'
        AND ge.linked_user_id IS NOT NULL
        AND ge.status = 'ACTIVE'
        AND gr.target_entity_id = ${targetEntityId}::uuid
        AND gr.status = 'ACTIVE'
        AND gr.deleted_at IS NULL
        AND gr.relationship_type = ANY(${relationshipTypes}::text[])
        AND gr.verification_status NOT IN ('USER_REJECTED', 'HIDDEN')
        AND (
          gr.verification_status = 'USER_VERIFIED'
          OR gr.source IN ('PROFILE', 'USER')
          OR gr.confidence_score >= 0.65
        )
        AND p.visibility = 'PUBLIC'
        AND p.is_onboarded = true
    `;
    return new Set(rows.map((r) => r.user_id).filter(Boolean));
  }

  private async usersLinkedToTargetByName(
    entityType: GraphEntityType,
    name: string,
    relationshipTypes: string[],
  ): Promise<Set<string>> {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const rows = await prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT DISTINCT ge.linked_user_id AS user_id
      FROM graph_entities ge
      INNER JOIN graph_relationships gr ON gr.source_entity_id = ge.id
      INNER JOIN graph_entities target ON target.id = gr.target_entity_id
      INNER JOIN profiles p ON p.user_id = ge.linked_user_id
      WHERE ge.entity_type = 'USER'
        AND ge.linked_user_id IS NOT NULL
        AND target.entity_type = ${entityType}::"GraphEntityType"
        AND (
          target.canonical_name ILIKE ${`%${name}%`}
          OR target.slug ILIKE ${`%${slug}%`}
        )
        AND gr.relationship_type = ANY(${relationshipTypes}::text[])
        AND gr.status = 'ACTIVE'
        AND gr.deleted_at IS NULL
        AND gr.verification_status NOT IN ('USER_REJECTED', 'HIDDEN')
        AND p.visibility = 'PUBLIC'
        AND p.is_onboarded = true
    `;
    return new Set(rows.map((r) => r.user_id).filter(Boolean));
  }

  private async unionCriteria(
    entities: InterpretedEntity[],
  ): Promise<Map<string, GraphExpertCandidate>> {
    const map = new Map<string, GraphExpertCandidate>();
    for (const ent of entities) {
      const ids = await this.findUserIdsForEntityCriterion({
        entityType: ent.type as GraphEntityType,
        graphEntityId: ent.graphEntityId ?? null,
        name: ent.value,
      });
      for (const uid of ids) {
        map.set(uid, mergeCandidate(map.get(uid), uid, ent));
      }
    }
    return map;
  }
}

function mergeCandidate(
  existing: GraphExpertCandidate | undefined,
  userId: string,
  ent: InterpretedEntity,
): GraphExpertCandidate {
  return {
    userId,
    matchedEntityIds: [
      ...(existing?.matchedEntityIds ?? []),
      ...(ent.graphEntityId ? [ent.graphEntityId] : []),
    ],
    matchedTypes: [
      ...(existing?.matchedTypes ?? []),
      ent.type as GraphEntityType,
    ],
  };
}

function intersectCandidates(
  current: Map<string, GraphExpertCandidate>,
  ids: Set<string>,
  ent: InterpretedEntity,
): Map<string, GraphExpertCandidate> {
  if (current.size === 0) {
    const next = new Map<string, GraphExpertCandidate>();
    for (const uid of ids) {
      next.set(uid, mergeCandidate(undefined, uid, ent));
    }
    return next;
  }
  const next = new Map<string, GraphExpertCandidate>();
  for (const uid of ids) {
    if (current.has(uid)) {
      next.set(uid, mergeCandidate(current.get(uid), uid, ent));
    }
  }
  return next;
}

function intersectWithOrGroup(
  current: Map<string, GraphExpertCandidate>,
  orSet: Map<string, GraphExpertCandidate>,
): Map<string, GraphExpertCandidate> {
  if (current.size === 0) return orSet;
  const next = new Map<string, GraphExpertCandidate>();
  for (const [uid, cand] of orSet) {
    if (current.has(uid)) {
      next.set(uid, {
        userId: uid,
        matchedEntityIds: [
          ...new Set([
            ...(current.get(uid)?.matchedEntityIds ?? []),
            ...cand.matchedEntityIds,
          ]),
        ],
        matchedTypes: [
          ...new Set([
            ...(current.get(uid)?.matchedTypes ?? []),
            ...cand.matchedTypes,
          ]),
        ],
      });
    }
  }
  return next;
}

async function boostOptional(
  map: Map<string, GraphExpertCandidate>,
  optional: InterpretedEntity[],
  repo: GraphSearchRepository,
): Promise<void> {
  for (const uid of map.keys()) {
    for (const ent of optional) {
      const ids = await repo.findUserIdsForEntityCriterion({
        entityType: ent.type as GraphEntityType,
        graphEntityId: ent.graphEntityId ?? null,
        name: ent.value,
      });
      if (ids.has(uid)) {
        map.set(uid, mergeCandidate(map.get(uid), uid, ent));
      }
    }
  }
}

export class GraphSearchService {
  constructor(private readonly repo: GraphSearchRepository) {}

  searchExperts(entities: InterpretedEntity[]) {
    return this.repo.findExpertsByMultipleCriteria(entities);
  }

  searchSkills(_q: string) {
    return Promise.resolve([]);
  }

  findExpertsBySkills(entities: InterpretedEntity[]) {
    return this.searchExperts(
      entities.filter((e) => e.type === "SKILL" || e.type === "TOOL"),
    );
  }

  findExpertsByIndustry(entities: InterpretedEntity[]) {
    return this.searchExperts(entities.filter((e) => e.type === "INDUSTRY"));
  }

  findExpertsByTechnology(entities: InterpretedEntity[]) {
    return this.searchExperts(
      entities.filter((e) => e.type === "TECHNOLOGY" || e.type === "TOOL"),
    );
  }

  findExpertsByProjectType(entities: InterpretedEntity[]) {
    return this.searchExperts(entities.filter((e) => e.type === "PROJECT"));
  }

  findExpertsByMultipleCriteria(entities: InterpretedEntity[]) {
    return this.searchExperts(entities);
  }

  async findSimilarExperts(userId: string): Promise<Set<string>> {
    const edges = await this.repo.getPublicUserGraphContext(userId);
    if (!edges?.length) return new Set();

    const entities: InterpretedEntity[] = edges
      .filter((e) => e.targetEntity)
      .slice(0, 12)
      .map((e) => ({
        type: e.targetEntity!.entityType,
        value: e.targetEntity!.canonicalName,
        requirement: "OPTIONAL" as const,
        graphEntityId: null,
        resolved: true,
      }));

    const map = await this.searchExperts(entities);
    map.delete(userId);
    return new Set(map.keys());
  }
}
