import { ConflictError, NotFoundError } from "@/domain/shared/errors";
import type { ProfileEntity, ProfileSummary } from "@/domain/profile/entities";
import type { ProfileRepository } from "@/domain/profile/ports";
import type {
  CreateProfileInput,
  UpdateProfileInput,
} from "@/domain/profile/value-objects";
import { slugifySkill } from "@/domain/profile/value-objects";
import { prisma } from "@/infrastructure/database/prisma";
import {
  toProfileEntity,
  toProfileSummary,
} from "@/infrastructure/database/mappers";
import { Prisma } from "@/generated/prisma/client";

const profileInclude = {
  skills: { include: { skill: true } },
  experiences: true,
  socialLinks: true,
  portfolio: true,
} as const;

export class PrismaProfileRepository implements ProfileRepository {
  async findByUserId(userId: string): Promise<ProfileEntity | null> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: profileInclude,
    });
    return profile ? toProfileEntity(profile) : null;
  }

  async findByUsername(username: string): Promise<ProfileEntity | null> {
    const profile = await prisma.profile.findUnique({
      where: { username: username.toLowerCase() },
      include: profileInclude,
    });
    return profile ? toProfileEntity(profile) : null;
  }

  async findSummaryByUserId(userId: string): Promise<ProfileSummary | null> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    return profile ? toProfileSummary(profile) : null;
  }

  async usernameExists(
    username: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const existing = await prisma.profile.findUnique({
      where: { username: username.toLowerCase() },
      select: { userId: true },
    });
    if (!existing) return false;
    if (excludeUserId && existing.userId === excludeUserId) return false;
    return true;
  }

  async create(
    userId: string,
    input: CreateProfileInput,
  ): Promise<ProfileEntity> {
    const username = input.username.toLowerCase();
    if (await this.usernameExists(username)) {
      throw new ConflictError("Username is already taken");
    }

    try {
      const profile = await prisma.$transaction(async (tx) => {
        const created = await tx.profile.create({
          data: {
            userId,
            username,
            displayName: input.displayName,
            bio: input.bio ?? null,
            headline: input.headline ?? null,
            websiteUrl: input.websiteUrl ?? null,
            location: input.location ?? null,
            timezone: input.timezone ?? null,
            visibility: input.visibility,
            publicTwinEnabled: input.publicTwinEnabled,
            isOnboarded: true,
          },
        });

        await this.syncSkills(tx, created.id, input.skills);
        await this.syncSocialLinks(tx, created.id, input.socialLinks);

        return tx.profile.findUniqueOrThrow({
          where: { id: created.id },
          include: profileInclude,
        });
      });

      return toProfileEntity(profile);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("Username is already taken");
      }
      throw error;
    }
  }

  async update(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<ProfileEntity> {
    const existing = await prisma.profile.findUnique({ where: { userId } });
    if (!existing) {
      throw new NotFoundError("Profile not found");
    }

    if (input.username) {
      const username = input.username.toLowerCase();
      if (await this.usernameExists(username, userId)) {
        throw new ConflictError("Username is already taken");
      }
    }

    try {
      const profile = await prisma.$transaction(async (tx) => {
        await tx.profile.update({
          where: { userId },
          data: {
            username: input.username?.toLowerCase(),
            displayName: input.displayName,
            bio: input.bio === undefined ? undefined : input.bio,
            headline: input.headline === undefined ? undefined : input.headline,
            websiteUrl:
              input.websiteUrl === undefined ? undefined : input.websiteUrl,
            location: input.location === undefined ? undefined : input.location,
            timezone: input.timezone === undefined ? undefined : input.timezone,
            visibility: input.visibility,
            publicTwinEnabled: input.publicTwinEnabled,
            isOnboarded: true,
          },
        });

        if (input.skills) {
          await this.syncSkills(tx, existing.id, input.skills);
        }
        if (input.socialLinks) {
          await this.syncSocialLinks(tx, existing.id, input.socialLinks);
        }

        return tx.profile.findUniqueOrThrow({
          where: { userId },
          include: profileInclude,
        });
      });

      return toProfileEntity(profile);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("Username is already taken");
      }
      throw error;
    }
  }

  private async syncSkills(
    tx: Prisma.TransactionClient,
    profileId: string,
    skills: string[],
  ): Promise<void> {
    await tx.profileSkill.deleteMany({ where: { profileId } });

    const unique = Array.from(
      new Map(
        skills
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => [slugifySkill(name), name] as const),
      ).entries(),
    );

    for (const [slug, name] of unique) {
      const skill = await tx.skill.upsert({
        where: { slug },
        create: { name, slug },
        update: { name },
      });

      await tx.profileSkill.create({
        data: {
          profileId,
          skillId: skill.id,
          level: 1,
        },
      });
    }
  }

  private async syncSocialLinks(
    tx: Prisma.TransactionClient,
    profileId: string,
    links: Array<{ platform: string; url: string }>,
  ): Promise<void> {
    await tx.socialLink.deleteMany({ where: { profileId } });

    if (links.length === 0) return;

    await tx.socialLink.createMany({
      data: links.map((link) => ({
        profileId,
        platform: link.platform,
        url: link.url,
      })),
    });
  }
}
