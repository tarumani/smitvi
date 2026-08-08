import { GRAPH_ENTITY_TYPES, GRAPH_RELATIONSHIP_TYPES } from "@/domain/graph/constants";
import type { GraphEntityType } from "@/generated/prisma/client";
import { generateGraphExtractionFromText } from "@/infrastructure/ai/graph-extraction";
import type { GraphService } from "@/application/graph/graph-service";
import type { PrismaKnowledgeRepository } from "@/infrastructure/database/repositories/knowledge-repository";
import type { PrismaGraphRepository } from "@/infrastructure/database/repositories/graph-repository";

const ENTITY_TYPE_MAP: Record<string, GraphEntityType> = {
  SKILL: "SKILL",
  TOPIC: "TOPIC",
  TECHNOLOGY: "TECHNOLOGY",
  TOOL: "TOOL",
  INDUSTRY: "INDUSTRY",
  COMPANY: "COMPANY",
  PROJECT: "PROJECT",
  PROFESSION: "PROFESSION",
};

export class ExtractGraphFromKnowledge {
  constructor(
    private readonly graph: GraphService,
    private readonly graphRepo: PrismaGraphRepository,
    private readonly knowledge: PrismaKnowledgeRepository,
  ) {}

  async execute(sourceId: string, userId: string): Promise<void> {
    const source = await this.knowledge.findByIdForUser(sourceId, userId);
    if (!source) return;

    const text =
      (await this.knowledge.getExtractedTextForUser(sourceId, userId)) ?? "";
    if (text.length < 40) return;

    const userEntity = await this.graph.ensureUserEntity(userId, source.title);
    const extracted = await generateGraphExtractionFromText(text);

    const docEntity = await this.graph.createEntity({
      entityType: "DOCUMENT",
      name: source.title,
      ownerUserId: userId,
      visibility: source.isPublic ? "PUBLIC" : "PRIVATE",
      aliasSource: "AI",
      metadata: { knowledgeSourceId: sourceId },
    });
    await this.graphRepo.linkEntityToKnowledgeSource(docEntity.id, sourceId);

    const entityKeyToId = new Map<string, string>();

    for (const ent of extracted.entities) {
      const mappedType = ENTITY_TYPE_MAP[ent.type.toUpperCase()];
      if (!mappedType || !GRAPH_ENTITY_TYPES.includes(mappedType)) continue;

      const resolved = await this.graph.resolveEntity({
        entityType: mappedType,
        name: ent.name,
        ownerUserId: mappedType === "PROJECT" ? userId : null,
      });
      const entity =
        resolved ??
        (await this.graph.createEntity({
          entityType: mappedType,
          name: ent.name,
          ownerUserId: mappedType === "PROJECT" ? userId : null,
          visibility: source.isPublic ? "PUBLIC" : "PRIVATE",
          aliasSource: "AI",
        }));

      entityKeyToId.set(`${mappedType}:${ent.name.toLowerCase()}`, entity.id);
    }

    for (const rel of extracted.relationships) {
      const relType = rel.type.toUpperCase();
      if (!GRAPH_RELATIONSHIP_TYPES.includes(relType as (typeof GRAPH_RELATIONSHIP_TYPES)[number])) {
        continue;
      }

      const sourceKey = `${rel.sourceType.toUpperCase()}:${rel.sourceName.toLowerCase()}`;
      const targetKey = `${rel.targetType.toUpperCase()}:${rel.targetName.toLowerCase()}`;

      let sourceIdResolved = entityKeyToId.get(sourceKey);
      let targetIdResolved = entityKeyToId.get(targetKey);

      if (relType.startsWith("USER_")) {
        sourceIdResolved = userEntity.id;
      }

      const sourceType = ENTITY_TYPE_MAP[rel.sourceType.toUpperCase()];
      const targetType = ENTITY_TYPE_MAP[rel.targetType.toUpperCase()];

      if (!sourceIdResolved && sourceType) {
        const e = await this.graph.resolveEntity({
          entityType: sourceType,
          name: rel.sourceName,
          ownerUserId: sourceType === "PROJECT" ? userId : null,
        });
        sourceIdResolved = e?.id;
      }
      if (!targetIdResolved && targetType) {
        const e = await this.graph.resolveEntity({
          entityType: targetType,
          name: rel.targetName,
          ownerUserId: targetType === "PROJECT" ? userId : null,
        });
        targetIdResolved = e?.id;
      }

      if (!sourceIdResolved || !targetIdResolved) continue;

      const excerpt =
        extracted.evidence.find((ev) => ev.relationshipIndex === rel.index)
          ?.excerpt ?? null;

      await this.graph.createRelationship({
        sourceEntityId: sourceIdResolved,
        relationshipType: relType,
        targetEntityId: targetIdResolved,
        confidenceScore: Math.min(1, Math.max(0, rel.confidence)),
        source: "AI",
        verificationStatus: "AI_DETECTED",
        metadata: { knowledgeSourceId: sourceId, sourceTitle: source.title },
        evidence: {
          sourceType: "KNOWLEDGE_SOURCE",
          sourceId: sourceId,
          contentExcerpt: excerpt?.slice(0, 500) ?? undefined,
          confidence: rel.confidence,
        },
      });
    }

    for (const topic of source.topics ?? []) {
      const topicEntity = await this.graph.createEntity({
        entityType: "TOPIC",
        name: topic,
        ownerUserId: null,
        visibility: "PUBLIC",
        aliasSource: "AI",
      });
      await this.graph.createRelationship({
        sourceEntityId: userEntity.id,
        relationshipType: "USER_INTERESTED_IN",
        targetEntityId: topicEntity.id,
        confidenceScore: 0.75,
        source: "AI",
        verificationStatus: "AI_DETECTED",
        evidence: {
          sourceType: "KNOWLEDGE_SOURCE",
          sourceId: sourceId,
          contentReference: "topics",
          confidence: 0.75,
        },
      });
    }
  }
}
