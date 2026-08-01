import type {
  AuditLogRepository,
  CreateAuditLogInput,
} from "@/domain/audit/ports";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export class PrismaAuditLogRepository implements AuditLogRepository {
  async create(input: CreateAuditLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata:
          input.metadata === null || input.metadata === undefined
            ? undefined
            : (input.metadata as Prisma.InputJsonValue),
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }
}
