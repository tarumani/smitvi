import type { UserEntity, UserPlan, UserRole } from "@/domain/user/entities";
import type {
  AdminUserListFilter,
  AdminUserListItem,
  SyncUserInput,
  UserRepository,
} from "@/domain/user/ports";
import { ForbiddenError } from "@/domain/shared/errors";
import {
  missingActivationLabels,
  incompleteProfileUserWhere,
} from "@/application/users/incomplete-profile-policy";
import {
  daysSince,
  incompleteProfileBlockCutoff,
  isIncompleteProfileEligibleToDelete,
} from "@/config/incomplete-profiles";
import { prisma } from "@/infrastructure/database/prisma";
import { toUserEntity } from "@/infrastructure/database/mappers";
import { Prisma } from "@/generated/prisma/client";

const INCOMPLETE_ONBOARDING_WHERE = incompleteProfileUserWhere();

function adminUserListWhere(options?: {
  query?: string;
  filter?: AdminUserListFilter;
}): Prisma.UserWhereInput {
  const q = options?.query?.trim();
  const filter = options?.filter ?? "all";
  const and: Prisma.UserWhereInput[] = [];

  if (q) {
    and.push({
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        {
          profile: {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      ],
    });
  }

  if (filter === "incomplete") {
    and.push(INCOMPLETE_ONBOARDING_WHERE);
  } else if (filter === "dormant") {
    and.push(INCOMPLETE_ONBOARDING_WHERE);
    and.push({ knowledgeSources: { none: {} } });
    and.push({ conversations: { none: {} } });
  } else if (filter === "paused") {
    and.push({ inactiveBlockedAt: { not: null } });
    and.push({ isBanned: false });
  } else if (filter === "stale") {
    and.push(INCOMPLETE_ONBOARDING_WHERE);
    and.push({ createdAt: { lte: incompleteProfileBlockCutoff() } });
  }

  return {
    deletedAt: null,
    ...(and.length > 0 ? { AND: and } : {}),
  };
}

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    return user ? toUserEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
    return user ? toUserEntity(user) : null;
  }

  async syncFromAuth(input: SyncUserInput): Promise<UserEntity> {
    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { id: input.id } });
    if (existing?.deletedAt) {
      throw new ForbiddenError("This account has been deleted");
    }

    const user = await prisma.user.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        email,
        emailVerified: input.emailVerified,
        lastLoginAt: new Date(),
      },
      update: {
        email,
        emailVerified: input.emailVerified,
        lastLoginAt: new Date(),
        // Signing in again recovers an inactivity pause (not an admin ban).
        ...(existing &&
        existing.inactiveBlockedAt &&
        !existing.isBanned
          ? { isActive: true, inactiveBlockedAt: null }
          : {}),
      },
    });
    return toUserEntity(user);
  }

  async updateLastLogin(id: string, at: Date): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: at },
    });
  }

  async updateRole(id: string, role: UserRole): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });
    return toUserEntity(user);
  }

  async updatePlan(id: string, plan: UserPlan): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: { plan },
    });
    return toUserEntity(user);
  }

  async setBanned(id: string, isBanned: boolean): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned,
        isActive: !isBanned,
        ...(isBanned ? {} : { inactiveBlockedAt: null }),
      },
    });
    return toUserEntity(user);
  }

  async markInactiveBlocked(id: string, at: Date): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        inactiveBlockedAt: at,
      },
    });
    return toUserEntity(user);
  }

  async clearInactiveBlock(id: string): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        inactiveBlockedAt: null,
        lastLoginAt: new Date(),
      },
    });
    return toUserEntity(user);
  }

  async countAll(): Promise<number> {
    return prisma.user.count({ where: { deletedAt: null } });
  }

  async countBanned(): Promise<number> {
    return prisma.user.count({
      where: { deletedAt: null, isBanned: true },
    });
  }

  async countForAdminList(options?: {
    query?: string;
    filter?: AdminUserListFilter;
  }): Promise<number> {
    return prisma.user.count({
      where: adminUserListWhere(options),
    });
  }

  async listForAdmin(options?: {
    query?: string;
    filter?: AdminUserListFilter;
    take?: number;
    skip?: number;
  }): Promise<AdminUserListItem[]> {
    const rows = await prisma.user.findMany({
      where: adminUserListWhere(options),
      orderBy: { createdAt: "desc" },
      take: options?.take ?? 50,
      skip: options?.skip ?? 0,
      include: {
        profile: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
            publicTwinEnabled: true,
            isOnboarded: true,
            activationStatus: true,
            profileType: true,
            headline: true,
            bio: true,
            expertiseAreas: true,
            industries: true,
            _count: { select: { skills: true } },
          },
        },
        _count: {
          select: {
            knowledgeSources: true,
            conversations: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      ...toUserEntity(row),
      profile: row.profile
        ? {
            username: row.profile.username,
            displayName: row.profile.displayName,
            avatarUrl: row.profile.avatarUrl,
            publicTwinEnabled: row.profile.publicTwinEnabled,
            isOnboarded: row.profile.isOnboarded,
            activationStatus: row.profile.activationStatus,
            profileType: row.profile.profileType,
          }
        : null,
      knowledgeCount: row._count.knowledgeSources,
      conversationCount: row._count.conversations,
      missingActivation: missingActivationLabels(
        row.profile
          ? {
              username: row.profile.username,
              profileType: row.profile.profileType,
              headline: row.profile.headline,
              bio: row.profile.bio,
              skillCount: row.profile._count.skills,
              expertiseAreas: row.profile.expertiseAreas,
              industries: row.profile.industries,
            }
          : null,
      ),
      daysSinceJoin: daysSince(row.createdAt),
      eligibleToDelete: isIncompleteProfileEligibleToDelete(row.createdAt),
    }));
  }

  async deleteById(id: string): Promise<boolean> {
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return false;
    await prisma.user.delete({ where: { id } });
    return true;
  }
}
