import type {
  ImportJobStatus,
  ImportJobType,
} from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export type ImportJobEntity = {
  id: string;
  userId: string;
  type: ImportJobType;
  status: ImportJobStatus;
  sourceUrl: string | null;
  storagePath: string | null;
  knowledgeSourceId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toEntity(row: {
  id: string;
  userId: string;
  type: ImportJobType;
  status: ImportJobStatus;
  sourceUrl: string | null;
  storagePath: string | null;
  knowledgeSourceId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ImportJobEntity {
  return { ...row };
}

export class PrismaImportJobRepository {
  async create(input: {
    userId: string;
    type: ImportJobType;
    sourceUrl?: string | null;
    storagePath?: string | null;
  }): Promise<ImportJobEntity> {
    const row = await prisma.importJob.create({
      data: {
        userId: input.userId,
        type: input.type,
        sourceUrl: input.sourceUrl ?? null,
        storagePath: input.storagePath ?? null,
        status: "PENDING",
      },
    });
    return toEntity(row);
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<ImportJobEntity | null> {
    const row = await prisma.importJob.findFirst({ where: { id, userId } });
    return row ? toEntity(row) : null;
  }

  async updateStatus(
    id: string,
    status: ImportJobStatus,
    data?: {
      errorMessage?: string | null;
      knowledgeSourceId?: string | null;
    },
  ): Promise<void> {
    await prisma.importJob.update({
      where: { id },
      data: {
        status,
        errorMessage: data?.errorMessage,
        knowledgeSourceId: data?.knowledgeSourceId,
      },
    });
  }
}
