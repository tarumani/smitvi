import type { UserEntity, UserPlan, UserRole } from "@/domain/user/entities";
import type {
  SyncUserInput,
  UserRepository,
} from "@/domain/user/ports";
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
        deletedAt: null,
        isActive: true,
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
}
