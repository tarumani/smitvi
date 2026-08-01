import { UnauthorizedError } from "@/domain/shared/errors";
import type { ProfileEntity } from "@/domain/profile/entities";
import type { ProfileRepository } from "@/domain/profile/ports";

export class GetMyProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(userId: string | null | undefined): Promise<ProfileEntity | null> {
    if (!userId) {
      throw new UnauthorizedError();
    }
    return this.profiles.findByUserId(userId);
  }
}
