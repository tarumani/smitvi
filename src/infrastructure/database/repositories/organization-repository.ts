import { randomBytes } from "node:crypto";
import {
  canManageMembers,
  type OrgRole,
  type OrganizationEntity,
  type OrganizationInviteEntity,
  type OrganizationMemberEntity,
} from "@/domain/organization/entities";
import { assertValidOrgSlug } from "@/domain/organization/slug";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/domain/shared/errors";
import { prisma } from "@/infrastructure/database/prisma";

const INVITE_DAYS = 14;

function toOrg(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  ownerUserId: string;
  seatLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): OrganizationEntity {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logoUrl,
    ownerUserId: row.ownerUserId,
    seatLimit: row.seatLimit,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaOrganizationRepository {
  async listForUser(userId: string) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId, organization: { isActive: true } },
      include: { organization: true },
      orderBy: { joinedAt: "asc" },
    });
    return memberships.map((m) => ({
      organization: toOrg(m.organization),
      role: m.role as OrgRole,
      membershipId: m.id,
    }));
  }

  async findBySlug(slug: string) {
    const row = await prisma.organization.findUnique({ where: { slug } });
    return row ? toOrg(row) : null;
  }

  async findById(id: string) {
    const row = await prisma.organization.findUnique({ where: { id } });
    return row ? toOrg(row) : null;
  }

  async getMembership(organizationId: string, userId: string) {
    const row = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      role: row.role as OrgRole,
      joinedAt: row.joinedAt,
    } satisfies OrganizationMemberEntity;
  }

  async requireMembership(organizationId: string, userId: string) {
    const membership = await this.getMembership(organizationId, userId);
    if (!membership) {
      throw new ForbiddenError("You are not a member of this organization");
    }
    return membership;
  }

  async create(input: {
    name: string;
    slug: string;
    description?: string | null;
    ownerUserId: string;
    seatLimit?: number;
  }) {
    const slug = assertValidOrgSlug(input.slug);
    const name = input.name.trim();
    if (name.length < 2 || name.length > 120) {
      throw new ValidationError("Organization name must be 2–120 characters");
    }

    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictError("That organization slug is already taken");
    }

    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        description: input.description?.trim() || null,
        ownerUserId: input.ownerUserId,
        seatLimit: input.seatLimit ?? 25,
        members: {
          create: {
            userId: input.ownerUserId,
            role: "OWNER",
          },
        },
      },
    });

    return toOrg(org);
  }

  async update(
    organizationId: string,
    actorUserId: string,
    data: { name?: string; description?: string | null },
  ) {
    const membership = await this.requireMembership(organizationId, actorUserId);
    if (!canManageMembers(membership.role)) {
      throw new ForbiddenError("Only owners and admins can update the organization");
    }

    const row = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: data.name?.trim(),
        description:
          data.description === undefined
            ? undefined
            : data.description?.trim() || null,
      },
    });
    return toOrg(row);
  }

  async listMembers(organizationId: string): Promise<OrganizationMemberEntity[]> {
    const rows = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          include: {
            profile: {
              select: {
                displayName: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    });

    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      role: row.role as OrgRole,
      joinedAt: row.joinedAt,
      email: row.user.email,
      displayName: row.user.profile?.displayName ?? null,
      username: row.user.profile?.username ?? null,
      avatarUrl: row.user.profile?.avatarUrl ?? null,
    }));
  }

  async createInvite(input: {
    organizationId: string;
    actorUserId: string;
    email: string;
    role: Exclude<OrgRole, "OWNER">;
  }) {
    const membership = await this.requireMembership(
      input.organizationId,
      input.actorUserId,
    );
    if (!canManageMembers(membership.role)) {
      throw new ForbiddenError("Only owners and admins can invite members");
    }
    if (input.role === "ADMIN" && membership.role !== "OWNER") {
      throw new ForbiddenError("Only the owner can invite admins");
    }

    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) {
      throw new ValidationError("A valid email is required");
    }

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: input.organizationId },
      include: { _count: { select: { members: true } } },
    });
    if (org._count.members >= org.seatLimit) {
      throw new ValidationError(
        `Seat limit reached (${org.seatLimit}). Upgrade seats to invite more members.`,
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const already = await this.getMembership(input.organizationId, existingUser.id);
      if (already) {
        throw new ConflictError("That user is already a member");
      }
    }

    const pending = await prisma.organizationInvite.findFirst({
      where: {
        organizationId: input.organizationId,
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });
    if (pending) {
      throw new ConflictError("A pending invite already exists for that email");
    }

    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

    const invite = await prisma.organizationInvite.create({
      data: {
        organizationId: input.organizationId,
        email,
        role: input.role,
        token,
        invitedById: input.actorUserId,
        expiresAt,
      },
    });

    return {
      id: invite.id,
      organizationId: invite.organizationId,
      email: invite.email,
      role: invite.role as OrgRole,
      token: invite.token,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    } satisfies OrganizationInviteEntity;
  }

  async listInvites(organizationId: string) {
    const rows = await prisma.organizationInvite.findMany({
      where: { organizationId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(
      (invite) =>
        ({
          id: invite.id,
          organizationId: invite.organizationId,
          email: invite.email,
          role: invite.role as OrgRole,
          token: invite.token,
          status: invite.status,
          expiresAt: invite.expiresAt,
          createdAt: invite.createdAt,
        }) satisfies OrganizationInviteEntity,
    );
  }

  async findInviteByToken(token: string) {
    return prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: true },
    });
  }

  async acceptInvite(token: string, userId: string, userEmail: string) {
    const invite = await this.findInviteByToken(token);
    if (!invite || invite.status !== "PENDING") {
      throw new NotFoundError("Invite not found or already used");
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      await prisma.organizationInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      throw new ValidationError("This invite has expired");
    }
    if (invite.email.toLowerCase() !== userEmail.trim().toLowerCase()) {
      throw new ForbiddenError(
        `This invite was sent to ${invite.email}. Sign in with that email to join.`,
      );
    }

    const existing = await this.getMembership(invite.organizationId, userId);
    if (existing) {
      await prisma.organizationInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      return toOrg(invite.organization);
    }

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: invite.organizationId },
      include: { _count: { select: { members: true } } },
    });
    if (org._count.members >= org.seatLimit) {
      throw new ValidationError("This organization is at its seat limit");
    }

    await prisma.$transaction([
      prisma.organizationMember.create({
        data: {
          organizationId: invite.organizationId,
          userId,
          role: invite.role === "OWNER" ? "MEMBER" : invite.role,
        },
      }),
      prisma.organizationInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      }),
    ]);

    return toOrg(invite.organization);
  }

  async updateMemberRole(input: {
    organizationId: string;
    actorUserId: string;
    targetUserId: string;
    role: Exclude<OrgRole, "OWNER">;
  }) {
    const actor = await this.requireMembership(
      input.organizationId,
      input.actorUserId,
    );
    if (actor.role !== "OWNER") {
      throw new ForbiddenError("Only the owner can change member roles");
    }
    if (input.targetUserId === input.actorUserId) {
      throw new ValidationError("You cannot change your own owner role this way");
    }

    const target = await this.getMembership(
      input.organizationId,
      input.targetUserId,
    );
    if (!target) throw new NotFoundError("Member not found");
    if (target.role === "OWNER") {
      throw new ForbiddenError("Cannot change the owner role");
    }

    await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: input.targetUserId,
        },
      },
      data: { role: input.role },
    });
  }

  async removeMember(input: {
    organizationId: string;
    actorUserId: string;
    targetUserId: string;
  }) {
    const actor = await this.requireMembership(
      input.organizationId,
      input.actorUserId,
    );
    const target = await this.getMembership(
      input.organizationId,
      input.targetUserId,
    );
    if (!target) throw new NotFoundError("Member not found");
    if (target.role === "OWNER") {
      throw new ForbiddenError("The organization owner cannot be removed");
    }

    const isSelf = input.actorUserId === input.targetUserId;
    if (!isSelf && !canManageMembers(actor.role)) {
      throw new ForbiddenError("You cannot remove this member");
    }
    if (!isSelf && target.role === "ADMIN" && actor.role !== "OWNER") {
      throw new ForbiddenError("Only the owner can remove admins");
    }

    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: input.targetUserId,
        },
      },
    });
  }
}
