import type { AuditLogRepository } from "@/domain/audit/ports";
import { ConflictError, UnauthorizedError } from "@/domain/shared/errors";
import type { ProfileEntity } from "@/domain/profile/entities";
import type { ProfileRepository } from "@/domain/profile/ports";
import {
  parseCreateProfileInput,
  type CreateProfileInput,
} from "@/domain/profile/value-objects";

import type { SyncProfileToGraph } from "@/application/graph/sync-profile-to-graph";

export class CreateProfile {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly syncProfileToGraph?: SyncProfileToGraph,
  ) {}

  async execute(
    userId: string | null | undefined,
    rawInput: unknown,
    context?: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<ProfileEntity> {
    if (!userId) {
      throw new UnauthorizedError();
    }

    const existing = await this.profiles.findByUserId(userId);
    if (existing) {
      throw new ConflictError("Profile already exists");
    }

    const input: CreateProfileInput = parseCreateProfileInput(rawInput);
    const profile = await this.profiles.create(userId, input);

    await this.auditLogs.create({
      actorId: userId,
      action: "PROFILE_CREATED",
      entityType: "profile",
      entityId: profile.id,
      metadata: { username: profile.username },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    if (this.syncProfileToGraph) {
      void this.syncProfileToGraph.execute(userId).catch(() => undefined);
    }

    return profile;
  }
}
