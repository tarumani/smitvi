import type { AuditAction } from "@/generated/prisma/enums";

export type CreateAuditLogInput = {
  readonly actorId?: string | null;
  readonly action: AuditAction;
  readonly entityType: string;
  readonly entityId?: string | null;
  readonly metadata?: Record<string, unknown> | null;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
};

export interface AuditLogRepository {
  create(input: CreateAuditLogInput): Promise<void>;
}
