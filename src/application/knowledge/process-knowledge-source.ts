import {
  chunkText,
  estimateTokenCount,
} from "@/domain/knowledge/chunking";
import { ValidationError } from "@/domain/shared/errors";
import type { PrismaKnowledgeRepository } from "@/infrastructure/database/repositories/knowledge-repository";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import { mapAiError } from "@/infrastructure/ai/map-ai-error";
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
    if (!source) {
      return;
    }

    const started = Date.now();

    try {
      await this.knowledge.updateStatus(sourceId, "EXTRACTING");
      let extractedText: string;
      if (source.storagePath) {
        const bytes = await readUpload(source.storagePath);
        extractedText = await extractTextFromFile(bytes, source.type);
      } else {
        const fromDb = await this.knowledge.getExtractedTextForUser(
          sourceId,
          userId,
        );
        extractedText = fromDb ?? "";
      }

      if (!extractedText || extractedText.length < 20) {
        throw new ValidationError(
          "No usable text could be extracted from this file. Paste at least a short paragraph.",
        );
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
      const mapped = mapAiError(error);
      await this.knowledge.updateStatus(sourceId, "FAILED", mapped.message);
      await this.auditLogs.create({
        actorId: userId,
        action: "KNOWLEDGE_FAILED",
        entityType: "knowledge_source",
        entityId: sourceId,
        metadata: { message: mapped.message },
      });
      throw mapped;
    }
  }
}
