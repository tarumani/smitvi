import type { AuditLogRepository } from "@/domain/audit/ports";
import { UnauthorizedError } from "@/domain/shared/errors";
import type { ProfileEntity } from "@/domain/profile/entities";
import type { ProfileRepository } from "@/domain/profile/ports";
import {
  parseUpdateProfileInput,
  type UpdateProfileInput,
} from "@/domain/profile/value-objects";

import type { SyncProfileToGraph } from "@/application/graph/sync-profile-to-graph";

export class UpdateProfile {
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

    const input: UpdateProfileInput = parseUpdateProfileInput(rawInput);
    const profile = await this.profiles.update(userId, input);

    await this.auditLogs.create({
      actorId: userId,
      action: "PROFILE_UPDATED",
      entityType: "profile",
      entityId: profile.id,
      metadata: { fields: Object.keys(input) },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    if (this.syncProfileToGraph) {
      void this.syncProfileToGraph.execute(userId).catch(() => undefined);
    }

    return profile;
  }
}
