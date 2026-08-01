export type OrgRole = "OWNER" | "ADMIN" | "MEMBER";

export type OrganizationEntity = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly logoUrl: string | null;
  readonly ownerUserId: string;
  readonly seatLimit: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type OrganizationMemberEntity = {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly role: OrgRole;
  readonly joinedAt: Date;
  readonly email?: string;
  readonly displayName?: string | null;
  readonly username?: string | null;
  readonly avatarUrl?: string | null;
};

export type OrganizationInviteEntity = {
  readonly id: string;
  readonly organizationId: string;
  readonly email: string;
  readonly role: OrgRole;
  readonly token: string;
  readonly status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  readonly expiresAt: Date;
  readonly createdAt: Date;
};

export function canManageMembers(role: OrgRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageOrgSettings(role: OrgRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function canUploadOrgKnowledge(role: OrgRole): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
}
