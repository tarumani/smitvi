import type { UserEntity, UserPlan, UserRole } from "@/domain/user/entities";

export type SyncUserInput = {
  readonly id: string;
  readonly email: string;
  readonly emailVerified: boolean;
};

export type AdminUserListItem = UserEntity & {
  readonly profile: {
    readonly username: string;
    readonly displayName: string;
    readonly avatarUrl: string | null;
    readonly publicTwinEnabled: boolean;
  } | null;
  readonly knowledgeCount: number;
  readonly conversationCount: number;
};

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  syncFromAuth(input: SyncUserInput): Promise<UserEntity>;
  updateLastLogin(id: string, at: Date): Promise<void>;
  updateRole(id: string, role: UserRole): Promise<UserEntity>;
  updatePlan(id: string, plan: UserPlan): Promise<UserEntity>;
  setBanned(id: string, isBanned: boolean): Promise<UserEntity>;
  listForAdmin(options?: {
    query?: string;
    take?: number;
    skip?: number;
  }): Promise<AdminUserListItem[]>;
  countAll(): Promise<number>;
  countBanned(): Promise<number>;
}
