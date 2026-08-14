import { MAX_UPLOAD_BYTES } from "@/config/ai";
import { resolveKnowledgeType } from "@/domain/knowledge/mime";
import type { KnowledgeSourceEntity } from "@/domain/knowledge/entities";
import { UnauthorizedError, ValidationError } from "@/domain/shared/errors";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import type { PrismaKnowledgeRepository } from "@/infrastructure/database/repositories/knowledge-repository";
import { saveUpload } from "@/infrastructure/storage/object-storage";
import { ProcessKnowledgeSource } from "@/application/knowledge/process-knowledge-source";

export class UploadKnowledge {
  constructor(
    private readonly knowledge: PrismaKnowledgeRepository,
    private readonly processor: ProcessKnowledgeSource,
    private readonly auditLogs = new PrismaAuditLogRepository(),
  ) {}

  async execute(input: {
    userId: string | null | undefined;
    fileName: string;
    mimeType: string | null;
    bytes: Buffer;
    title?: string;
    organizationId?: string | null;
  }): Promise<KnowledgeSourceEntity> {
    if (!input.userId) {
      throw new UnauthorizedError();
    }

    if (!input.bytes.length) {
      throw new ValidationError("Empty file upload");
    }

    if (input.bytes.length > MAX_UPLOAD_BYTES) {
      throw new ValidationError("File exceeds the 15MB upload limit");
    }

    const type = resolveKnowledgeType(input.fileName, input.mimeType);
    const storagePath = await saveUpload(
      input.userId,
      input.fileName,
      input.bytes,
    );

    const title =
      input.title?.trim() ||
      input.fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() ||
      "Untitled knowledge";

    const source = await this.knowledge.createUpload({
      userId: input.userId,
      organizationId: input.organizationId ?? null,
      type,
      title,
      originalName: input.fileName,
      mimeType: input.mimeType,
      byteSize: input.bytes.length,
      storagePath,
    });

    await this.auditLogs.create({
      actorId: input.userId,
      action: "KNOWLEDGE_UPLOADED",
      entityType: "knowledge_source",
      entityId: source.id,
      metadata: {
        type,
        fileName: input.fileName,
        organizationId: input.organizationId ?? null,
      },
    });

    // Process inline for Sprint 2 local reliability; swap to queue later.
    await this.processor.execute(source.id, input.userId);

    const ready = await this.knowledge.findByIdForUser(source.id, input.userId);
    if (!ready) {
      throw new Error("Knowledge source disappeared after processing");
    }
    void import("@/application/intelligence/record-meaningful-activity").then(
      ({ recordMeaningfulActivity }) =>
        recordMeaningfulActivity({
          userId: input.userId!,
          type: "KNOWLEDGE_ADDED",
          title: `Published knowledge: ${title.slice(0, 80)}`,
        }),
    );
    return ready;
  }
}
