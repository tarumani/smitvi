import type { AuditLogRepository } from "@/domain/audit/ports";
import type { UserEntity } from "@/domain/user/entities";
import type { UserRepository } from "@/domain/user/ports";

export type AuthIdentity = {
  readonly id: string;
  readonly email: string;
  readonly emailVerified: boolean;
};

export class SyncAuthenticatedUser {
  constructor(
    private readonly users: UserRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async execute(
    identity: AuthIdentity,
    context?: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<UserEntity> {
    const user = await this.users.syncFromAuth({
      id: identity.id,
      email: identity.email,
      emailVerified: identity.emailVerified,
    });

    await this.auditLogs.create({
      actorId: user.id,
      action: "USER_SYNCED",
      entityType: "user",
      entityId: user.id,
      metadata: { email: user.email },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return user;
  }
}
