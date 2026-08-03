import type { UserEntity, UserPlan, UserRole } from "@/domain/user/entities";
import type {
  AdminUserListItem,
  SyncUserInput,
  UserRepository,
} from "@/domain/user/ports";
import { ForbiddenError } from "@/domain/shared/errors";
import { prisma } from "@/infrastructure/database/prisma";
import { toUserEntity } from "@/infrastructure/database/mappers";

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

  async listForAdmin(options?: {
    query?: string;
    take?: number;
    skip?: number;
  }): Promise<AdminUserListItem[]> {
    const q = options?.query?.trim();
    const rows = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(q
          ? {
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
            }
          : {}),
      },
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
          }
        : null,
      knowledgeCount: row._count.knowledgeSources,
      conversationCount: row._count.conversations,
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
