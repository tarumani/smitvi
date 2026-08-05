import type {
  KnowledgeFaq,
  KnowledgeSourceEntity,
  KnowledgeSourceType,
  KnowledgeProcessingStatus,
  RetrievedChunk,
} from "@/domain/knowledge/entities";
import { cosineSimilarity } from "@/domain/knowledge/similarity";
import { prisma } from "@/infrastructure/database/prisma";
import { Prisma } from "@/generated/prisma/client";

function parseFaqs(value: Prisma.JsonValue | null): KnowledgeFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "question" in item &&
        "answer" in item &&
        typeof item.question === "string" &&
        typeof item.answer === "string"
      ) {
        return { question: item.question, answer: item.answer };
      }
      return null;
    })
    .filter((item): item is KnowledgeFaq => item !== null);
}

function toSourceEntity(row: {
  id: string;
  userId: string;
  organizationId: string | null;
  type: KnowledgeSourceType;
  title: string;
  originalName: string | null;
  mimeType: string | null;
  byteSize: number | null;
  storagePath: string | null;
  sourceUrl: string | null;
  status: KnowledgeProcessingStatus;
  errorMessage: string | null;
  summary: string | null;
  faqs: Prisma.JsonValue | null;
  tags: string[];
  topics: string[];
  chunkCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date | null;
}): KnowledgeSourceEntity {
  return {
    id: row.id,
    userId: row.userId,
    organizationId: row.organizationId,
    type: row.type,
    title: row.title,
    originalName: row.originalName,
    mimeType: row.mimeType,
    byteSize: row.byteSize,
    storagePath: row.storagePath,
    sourceUrl: row.sourceUrl,
    status: row.status,
    errorMessage: row.errorMessage,
    summary: row.summary,
    faqs: parseFaqs(row.faqs),
    tags: row.tags,
    topics: row.topics,
    chunkCount: row.chunkCount,
    isPublic: row.isPublic,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    processedAt: row.processedAt,
  };
}

export class PrismaKnowledgeRepository {
  async listByUser(userId: string): Promise<KnowledgeSourceEntity[]> {
    const rows = await prisma.knowledgeSource.findMany({
      where: { userId, organizationId: null },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toSourceEntity);
  }

  async listByOrganization(
    organizationId: string,
  ): Promise<KnowledgeSourceEntity[]> {
    const rows = await prisma.knowledgeSource.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toSourceEntity);
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<KnowledgeSourceEntity | null> {
    const row = await prisma.knowledgeSource.findFirst({
      where: { id, userId },
    });
    return row ? toSourceEntity(row) : null;
  }

  async createUpload(input: {
    userId: string;
    organizationId?: string | null;
    type: KnowledgeSourceType;
    title: string;
    originalName: string;
    mimeType: string | null;
    byteSize: number;
    storagePath: string;
  }): Promise<KnowledgeSourceEntity> {
    const row = await prisma.knowledgeSource.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId ?? null,
        type: input.type,
        title: input.title,
        originalName: input.originalName,
        mimeType: input.mimeType,
        byteSize: input.byteSize,
        storagePath: input.storagePath,
        status: "PENDING",
        // Org knowledge stays private to the workspace.
        isPublic: false,
      },
    });
    return toSourceEntity(row);
  }

  async createFromWebsite(input: {
    userId: string;
    title: string;
    sourceUrl: string;
    extractedText: string;
  }): Promise<KnowledgeSourceEntity> {
    const row = await prisma.knowledgeSource.create({
      data: {
        userId: input.userId,
        type: "WEBSITE",
        title: input.title,
        sourceUrl: input.sourceUrl,
        extractedText: input.extractedText,
        status: "PENDING",
        isPublic: false,
      },
    });
    return toSourceEntity(row);
  }

  async getExtractedTextForUser(
    id: string,
    userId: string,
  ): Promise<string | null> {
    const row = await prisma.knowledgeSource.findFirst({
      where: { id, userId },
      select: { extractedText: true },
    });
    return row?.extractedText ?? null;
  }

  async updateStatus(
    id: string,
    status: KnowledgeProcessingStatus,
    errorMessage?: string | null,
  ): Promise<void> {
    await prisma.knowledgeSource.update({
      where: { id },
      data: {
        status,
        errorMessage: errorMessage ?? null,
      },
    });
  }

  async saveProcessed(input: {
    id: string;
    extractedText: string;
    summary: string;
    faqs: KnowledgeFaq[];
    tags: string[];
    topics: string[];
    chunks: Array<{
      chunkIndex: number;
      content: string;
      tokenCount: number;
      embedding: number[];
    }>;
    processingMs: number;
  }): Promise<KnowledgeSourceEntity> {
    const row = await prisma.$transaction(async (tx) => {
      await tx.knowledgeChunk.deleteMany({ where: { sourceId: input.id } });

      const source = await tx.knowledgeSource.findUniqueOrThrow({
        where: { id: input.id },
      });

      if (input.chunks.length > 0) {
        await tx.knowledgeChunk.createMany({
          data: input.chunks.map((chunk) => ({
            sourceId: input.id,
            userId: source.userId,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            tokenCount: chunk.tokenCount,
            embedding: chunk.embedding,
          })),
        });
      }

      return tx.knowledgeSource.update({
        where: { id: input.id },
        data: {
          status: "READY",
          extractedText: input.extractedText,
          summary: input.summary,
          faqs: input.faqs,
          tags: input.tags,
          topics: input.topics,
          chunkCount: input.chunks.length,
          processingMs: input.processingMs,
          processedAt: new Date(),
          errorMessage: null,
        },
      });
    });

    return toSourceEntity(row);
  }

  async countReadySources(
    userId: string,
    options?: { publicOnly?: boolean; organizationId?: string | null },
  ): Promise<number> {
    if (options?.organizationId) {
      return prisma.knowledgeSource.count({
        where: {
          organizationId: options.organizationId,
          status: "READY",
        },
      });
    }
    return prisma.knowledgeSource.count({
      where: {
        userId,
        organizationId: null,
        status: "READY",
        ...(options?.publicOnly ? { isPublic: true } : {}),
      },
    });
  }

  async listPublicByUser(userId: string): Promise<KnowledgeSourceEntity[]> {
    const rows = await prisma.knowledgeSource.findMany({
      where: {
        userId,
        organizationId: null,
        status: "READY",
        isPublic: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(toSourceEntity);
  }

  async countAll(): Promise<number> {
    return prisma.knowledgeSource.count();
  }

  async countByStatus(status: KnowledgeProcessingStatus): Promise<number> {
    return prisma.knowledgeSource.count({ where: { status } });
  }

  async listRecentForAdmin(options?: {
    status?: KnowledgeProcessingStatus;
    take?: number;
  }) {
    const rows = await prisma.knowledgeSource.findMany({
      where: options?.status ? { status: options.status } : undefined,
      orderBy: { createdAt: "desc" },
      take: options?.take ?? 50,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      ...toSourceEntity(row),
      owner: {
        userId: row.user.id,
        email: row.user.email,
        username: row.user.profile?.username ?? null,
        displayName: row.user.profile?.displayName ?? null,
      },
    }));
  }

  async setPublic(
    id: string,
    userId: string,
    isPublic: boolean,
  ): Promise<KnowledgeSourceEntity | null> {
    const existing = await prisma.knowledgeSource.findFirst({
      where: { id, userId, organizationId: null },
    });
    if (!existing) return null;
    const row = await prisma.knowledgeSource.update({
      where: { id },
      data: { isPublic },
    });
    return toSourceEntity(row);
  }

  async searchSimilar(input: {
    ownerUserId: string;
    queryEmbedding: number[];
    topK: number;
    minScore: number;
    publicOnly?: boolean;
    organizationId?: string | null;
  }): Promise<RetrievedChunk[]> {
    const chunks = await prisma.knowledgeChunk.findMany({
      where: input.organizationId
        ? {
            source: {
              organizationId: input.organizationId,
              status: "READY",
            },
          }
        : {
            userId: input.ownerUserId,
            source: {
              organizationId: null,
              status: "READY",
              ...(input.publicOnly ? { isPublic: true } : {}),
            },
          },
      include: {
        source: { select: { title: true } },
      },
      take: 2000,
    });

    return chunks
      .map((chunk) => ({
        id: chunk.id,
        sourceId: chunk.sourceId,
        userId: chunk.userId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        embedding: chunk.embedding,
        score: cosineSimilarity(input.queryEmbedding, chunk.embedding),
        sourceTitle: chunk.source.title,
      }))
      .filter((chunk) => chunk.score >= input.minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, input.topK);
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.knowledgeSource.findFirst({
      where: { id, userId },
      select: { id: true, storagePath: true },
    });
    if (!existing) return false;
    await prisma.knowledgeSource.delete({ where: { id } });
    return true;
  }

  async findByIdForAdmin(id: string) {
    return prisma.knowledgeSource.findUnique({
      where: { id },
      select: {
        id: true,
        storagePath: true,
        title: true,
        userId: true,
      },
    });
  }

  async deleteById(id: string): Promise<boolean> {
    const existing = await prisma.knowledgeSource.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return false;
    await prisma.knowledgeSource.delete({ where: { id } });
    return true;
  }
}
