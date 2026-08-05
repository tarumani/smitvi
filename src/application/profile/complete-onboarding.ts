import type { AuditLogRepository } from "@/domain/audit/ports";
import { UnauthorizedError } from "@/domain/shared/errors";
import type { ProfileEntity } from "@/domain/profile/entities";
import type { ProfileRepository } from "@/domain/profile/ports";

export class CompleteOnboarding {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async execute(userId: string | null | undefined): Promise<ProfileEntity> {
    if (!userId) {
      throw new UnauthorizedError();
    }

    const profile = await this.profiles.completeOnboarding(userId);

    await this.auditLogs.create({
      actorId: userId,
      action: "PROFILE_UPDATED",
      entityType: "profile",
      entityId: profile.id,
      metadata: { onboardingCompleted: true },
    });

    return profile;
  }
}
