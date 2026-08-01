export type UserRole =
  | "USER"
  | "EXPERT"
  | "MODERATOR"
  | "ADMIN"
  | "SUPER_ADMIN";

export type UserPlan = "FREE" | "PRO" | "BUSINESS";

export type UserEntity = {
  readonly id: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly role: UserRole;
  readonly plan: UserPlan;
  readonly isActive: boolean;
  readonly isBanned: boolean;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;
};

export function canAccessAdmin(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "MODERATOR";
}

export function isPrivileged(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
