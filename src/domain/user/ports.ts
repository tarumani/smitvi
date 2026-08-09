import type { UserEntity, UserPlan, UserRole } from "@/domain/user/entities";

export type SyncUserInput = {
  readonly id: string;
  readonly email: string;
  readonly emailVerified: boolean;
};

export type AdminUserListFilter = "all" | "incomplete" | "dormant";

export type AdminUserListItem = UserEntity & {
  readonly profile: {
    readonly username: string;
    readonly displayName: string;
    readonly avatarUrl: string | null;
    readonly publicTwinEnabled: boolean;
    readonly isOnboarded: boolean;
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
  /** Block an abandoned account for inactivity (reversible on login). */
  markInactiveBlocked(id: string, at: Date): Promise<UserEntity>;
  /** Clear inactivity block after the user authenticates again. */
  clearInactiveBlock(id: string): Promise<UserEntity>;
  listForAdmin(options?: {
    query?: string;
    filter?: AdminUserListFilter;
    take?: number;
    skip?: number;
  }): Promise<AdminUserListItem[]>;
  countForAdminList(options?: {
    query?: string;
    filter?: AdminUserListFilter;
  }): Promise<number>;
  countAll(): Promise<number>;
  countBanned(): Promise<number>;
  /** Permanently remove app user row (auth deletion handled separately). */
  deleteById(id: string): Promise<boolean>;
}
