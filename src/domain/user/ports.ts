import type { UserEntity, UserPlan, UserRole } from "@/domain/user/entities";

export type SyncUserInput = {
  readonly id: string;
  readonly email: string;
  readonly emailVerified: boolean;
};

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  syncFromAuth(input: SyncUserInput): Promise<UserEntity>;
  updateLastLogin(id: string, at: Date): Promise<void>;
  updateRole(id: string, role: UserRole): Promise<UserEntity>;
  updatePlan(id: string, plan: UserPlan): Promise<UserEntity>;
}
