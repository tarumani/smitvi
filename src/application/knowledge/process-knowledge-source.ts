import {
  chunkText,
  estimateTokenCount,
} from "@/domain/knowledge/chunking";
import type { PrismaKnowledgeRepository } from "@/infrastructure/database/repositories/knowledge-repository";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import {
  embedTexts,
  generateKnowledgeMetadata,
} from "@/infrastructure/ai/openai-client";
import { extractTextFromFile } from "@/infrastructure/knowledge/extract-text";
import { readUpload } from "@/infrastructure/storage/object-storage";

export class ProcessKnowledgeSource {
  constructor(
    private readonly knowledge: PrismaKnowledgeRepository,
    private readonly auditLogs = new PrismaAuditLogRepository(),
  ) {}

  async execute(sourceId: string, userId: string): Promise<void> {
    const source = await this.knowledge.findByIdForUser(sourceId, userId);
    if (!source || !source.storagePath) {
      return;
    }

    const started = Date.now();

    try {
      await this.knowledge.updateStatus(sourceId, "EXTRACTING");
      const bytes = await readUpload(source.storagePath);
      const extractedText = await extractTextFromFile(bytes, source.type);

      if (!extractedText || extractedText.length < 20) {
        throw new Error("No usable text could be extracted from this file.");
      }

      await this.knowledge.updateStatus(sourceId, "CHUNKING");
      const chunks = chunkText(extractedText);

      await this.knowledge.updateStatus(sourceId, "EMBEDDING");
      const embeddings = await embedTexts(chunks);

      await this.knowledge.updateStatus(sourceId, "SUMMARIZING");
      const metadata = await generateKnowledgeMetadata(extractedText);

      await this.knowledge.saveProcessed({
        id: sourceId,
        extractedText,
        summary: metadata.summary,
        faqs: metadata.faqs,
        tags: metadata.tags,
        topics: metadata.topics,
        chunks: chunks.map((content, index) => ({
          chunkIndex: index,
          content,
          tokenCount: estimateTokenCount(content),
          embedding: embeddings[index] ?? [],
        })),
        processingMs: Date.now() - started,
      });

      await this.auditLogs.create({
        actorId: userId,
        action: "KNOWLEDGE_PROCESSED",
        entityType: "knowledge_source",
        entityId: sourceId,
        metadata: {
          chunkCount: chunks.length,
          tags: metadata.tags,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Knowledge processing failed";
      await this.knowledge.updateStatus(sourceId, "FAILED", message);
      await this.auditLogs.create({
        actorId: userId,
        action: "KNOWLEDGE_FAILED",
        entityType: "knowledge_source",
        entityId: sourceId,
        metadata: { message },
      });
      throw error;
    }
  }
}
