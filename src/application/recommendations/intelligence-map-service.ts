import type {
  IntelligenceMapEdge,
  IntelligenceMapNode,
  IntelligenceMapPayload,
} from "@/domain/recommendations/types";
import type { GraphService } from "@/application/graph/graph-service";
import type { UserGraphDto } from "@/application/graph/graph-service";
import { prisma } from "@/infrastructure/database/prisma";

const LEVEL1_TYPES = new Set([
  "SKILL",
  "PROJECT",
  "COMPANY",
  "TOPIC",
  "INDUSTRY",
  "PROFESSION",
  "EDUCATION",
  "CERTIFICATION",
]);

const LEVEL2_TYPES = new Set([
  "TECHNOLOGY",
  "TOOL",
  "DOCUMENT",
  "PERSON",
  "COMMUNITY",
  "COURSE",
  "ARTICLE",
]);

export class IntelligenceMapService {
  constructor(private readonly graph: GraphService) {}

  async buildForUser(userId: string): Promise<IntelligenceMapPayload> {
    const userGraph = await this.graph.getUserGraph(userId, userId);
    const nodes: IntelligenceMapNode[] = [];
    const edges: IntelligenceMapEdge[] = [];

    if (!userGraph.userEntity) {
      return { nodes, edges, filters: defaultFilters() };
    }

    const centerId = userGraph.userEntity.id;
    nodes.push({
      id: centerId,
      label: userGraph.userEntity.canonicalName,
      type: "USER",
      level: 0,
      confidence: 1,
      verificationStatus: "USER_VERIFIED",
    });

    const addBucket = (
      items: UserGraphDto["skills"],
      relType: string,
    ) => {
      for (const { entity, relationship } of items) {
        const level = LEVEL1_TYPES.has(entity.entityType) ? 1 : 2;
        nodes.push(nodeFromEntity(entity, level, relationship.confidenceScore));
        edges.push({
          id: relationship.id,
          source: centerId,
          target: entity.id,
          relationshipType: relType,
          confidence: relationship.confidenceScore,
        });
      }
    };

    addBucket(userGraph.skills, "USER_HAS_SKILL");
    addBucket(userGraph.expertise, "USER_HAS_EXPERTISE");
    addBucket(userGraph.projects, "USER_CREATED_PROJECT");
    addBucket(userGraph.companies, "USER_WORKED_AT");
    addBucket(userGraph.topics, "USER_INTERESTED_IN");
    addBucket(userGraph.industries, "USER_WORKS_IN_INDUSTRY");
    addBucket(userGraph.technologies, "USER_USES_TECHNOLOGY");
    addBucket(userGraph.tools, "USER_USES_TOOL");

    const knowledge = await prisma.knowledgeSource.findMany({
      where: { userId, isPublic: true, status: "READY" },
      take: 8,
      select: { id: true, title: true },
    });

    for (const k of knowledge) {
      const kid = `knowledge:${k.id}`;
      nodes.push({
        id: kid,
        label: k.title,
        type: "KNOWLEDGE",
        level: 2,
        confidence: 1,
      });
      edges.push({
        id: `edge-k-${k.id}`,
        source: centerId,
        target: kid,
        relationshipType: "USER_PUBLISHED",
        confidence: 1,
      });
    }

    const dedupedNodes = dedupeNodes(nodes);
    const nodeIds = new Set(dedupedNodes.map((n) => n.id));

    return {
      nodes: dedupedNodes,
      edges: edges.filter(
        (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
      ),
      filters: defaultFilters(),
    };
  }

  async getNodeDetail(userId: string, nodeId: string) {
    if (nodeId.startsWith("knowledge:")) {
      const sourceId = nodeId.replace("knowledge:", "");
      const source = await prisma.knowledgeSource.findFirst({
        where: { id: sourceId, userId },
        select: { id: true, title: true, summary: true, topics: true, tags: true },
      });
      return source
        ? { type: "KNOWLEDGE", ...source, evidence: [] }
        : null;
    }

    const entity = await this.graph.getEntity(nodeId);
    if (!entity) return null;

    const neighbors = await this.graph.getNeighbors(nodeId, 1);
    const rels = await this.graph.getRelatedEntities(nodeId);

    return {
      entity,
      neighbors: neighbors.slice(0, 12),
      related: rels.slice(0, 12),
    };
  }
}

function nodeFromEntity(
  entity: {
    id: string;
    canonicalName: string;
    entityType: string;
    description: string | null;
  },
  level: 0 | 1 | 2,
  confidence: number,
): IntelligenceMapNode {
  return {
    id: entity.id,
    label: entity.canonicalName,
    type: entity.entityType,
    level: LEVEL2_TYPES.has(entity.entityType) ? 2 : level,
    confidence,
    description: entity.description,
  };
}

function dedupeNodes(nodes: IntelligenceMapNode[]): IntelligenceMapNode[] {
  const map = new Map<string, IntelligenceMapNode>();
  for (const n of nodes) {
    if (!map.has(n.id)) map.set(n.id, n);
  }
  return [...map.values()];
}

function defaultFilters(): string[] {
  return [
    "skills",
    "projects",
    "experience",
    "knowledge",
    "industries",
    "technologies",
    "companies",
    "people",
    "topics",
  ];
}
