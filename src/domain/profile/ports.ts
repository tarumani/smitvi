import type {
  ProfileEntity,
  ProfileSummary,
} from "@/domain/profile/entities";
import type {
  CreateProfileInput,
  UpdateProfileInput,
} from "@/domain/profile/value-objects";

export interface ProfileRepository {
  findByUserId(userId: string): Promise<ProfileEntity | null>;
  findByUsername(username: string): Promise<ProfileEntity | null>;
  findSummaryByUserId(userId: string): Promise<ProfileSummary | null>;
  usernameExists(username: string, excludeUserId?: string): Promise<boolean>;
  create(
    userId: string,
    input: CreateProfileInput,
    options?: { referrerUsername?: string | null },
  ): Promise<ProfileEntity>;
  update(userId: string, input: UpdateProfileInput): Promise<ProfileEntity>;
  completeOnboarding(userId: string): Promise<ProfileEntity>;
  updateReputationScore(userId: string, score: number): Promise<void>;
}
