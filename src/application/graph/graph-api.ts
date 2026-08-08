import { z } from "zod";
import type { GraphEntityType } from "@/generated/prisma/client";
import { GRAPH_RELATIONSHIP_TYPES } from "@/domain/graph/constants";

export const createEntityBodySchema = z.object({
  entityType: z.string(),
  name: z.string().min(1).max(240),
  description: z.string().max(2000).optional(),
  ownerUserId: z.string().uuid().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "FOLLOWERS", "CONNECTIONS"]).optional(),
});

export const createRelationshipBodySchema = z.object({
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  relationshipType: z.enum(GRAPH_RELATIONSHIP_TYPES as unknown as [string, ...string[]]),
  confidenceScore: z.number().min(0).max(1).optional(),
  evidence: z
    .object({
      sourceType: z.enum([
        "KNOWLEDGE_SOURCE",
        "KNOWLEDGE_CHUNK",
        "PROFILE_FIELD",
        "USER_ASSERTION",
        "ADMIN",
      ]),
      sourceId: z.string(),
      contentReference: z.string().optional(),
      contentExcerpt: z.string().optional(),
      confidence: z.number().min(0).max(1),
    })
    .optional(),
});

export const patchRelationshipBodySchema = z.object({
  confidenceScore: z.number().min(0).max(1).optional(),
  verificationStatus: z
    .enum(["USER_VERIFIED", "USER_REJECTED", "HIDDEN", "AI_DETECTED", "PENDING"])
    .optional(),
});

export function mapEntityType(value: string): GraphEntityType {
  return value.toUpperCase() as GraphEntityType;
}

export function serializeUserGraph(graph: Awaited<
  ReturnType<import("@/application/graph/graph-service").GraphService["getUserGraph"]>
>) {
  const mapEdge = (items: typeof graph.skills) =>
    items.map(({ entity, relationship }) => ({
      entity: {
        id: entity.id,
        type: entity.entityType,
        name: entity.canonicalName,
        slug: entity.slug,
      },
      relationship: {
        id: relationship.id,
        type: relationship.relationshipType,
        confidenceScore: relationship.confidenceScore,
        verificationStatus: relationship.verificationStatus,
        verified: relationship.verified,
        source: relationship.source,
        evidence: relationship.evidence,
      },
    }));

  return {
    user: graph.userEntity
      ? {
          id: graph.userEntity.id,
          name: graph.userEntity.canonicalName,
        }
      : null,
    skills: mapEdge(graph.skills),
    expertise: mapEdge(graph.expertise),
    topics: mapEdge(graph.topics),
    technologies: mapEdge(graph.technologies),
    tools: mapEdge(graph.tools),
    companies: mapEdge(graph.companies),
    projects: mapEdge(graph.projects),
    industries: mapEdge(graph.industries),
    pending: graph.pending.map((r) => ({
      id: r.id,
      type: r.relationshipType,
      confidenceScore: r.confidenceScore,
      verificationStatus: r.verificationStatus,
      target: r.targetEntity
        ? {
            id: r.targetEntity.id,
            name: r.targetEntity.canonicalName,
            type: r.targetEntity.entityType,
          }
        : null,
      evidence: r.evidence,
    })),
  };
}
