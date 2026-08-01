import { randomBytes } from "node:crypto";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/domain/shared/errors";
import { prisma } from "@/infrastructure/database/prisma";

export type ReviewEntity = {
  id: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewerName: string;
  reviewerUsername: string;
};

export class PrismaSocialRepository {
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const row = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new ValidationError("You cannot follow yourself");
    }

    const target = await prisma.profile.findUnique({
      where: { userId: followingId },
      select: { id: true, visibility: true },
    });
    if (!target || target.visibility === "PRIVATE") {
      throw new NotFoundError("Profile not found");
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.follow.create({
          data: { followerId, followingId },
        });
        await tx.profile.update({
          where: { userId: followingId },
          data: { followersCount: { increment: 1 } },
        });
        await tx.profile.update({
          where: { userId: followerId },
          data: { followingCount: { increment: 1 } },
        });
      });
    } catch {
      throw new ConflictError("Already following this profile");
    }
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    if (!existing) return;

    await prisma.$transaction(async (tx) => {
      await tx.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      });
      await tx.profile.update({
        where: { userId: followingId },
        data: { followersCount: { decrement: 1 } },
      });
      await tx.profile.update({
        where: { userId: followerId },
        data: { followingCount: { decrement: 1 } },
      });
    });
  }

  async listReviews(revieweeId: string, limit = 20): Promise<ReviewEntity[]> {
    const rows = await prisma.review.findMany({
      where: { revieweeId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        reviewer: {
          include: {
            profile: {
              select: { displayName: true, username: true },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      reviewerId: row.reviewerId,
      revieweeId: row.revieweeId,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt,
      reviewerName: row.reviewer.profile?.displayName ?? "Member",
      reviewerUsername: row.reviewer.profile?.username ?? "unknown",
    }));
  }

  async createReview(input: {
    reviewerId: string;
    revieweeId: string;
    rating: number;
    comment?: string | null;
  }): Promise<ReviewEntity> {
    if (input.reviewerId === input.revieweeId) {
      throw new ValidationError("You cannot review yourself");
    }
    if (input.rating < 1 || input.rating > 5) {
      throw new ValidationError("Rating must be between 1 and 5");
    }

    const target = await prisma.profile.findUnique({
      where: { userId: input.revieweeId },
      select: { id: true, visibility: true },
    });
    if (!target || target.visibility === "PRIVATE") {
      throw new NotFoundError("Profile not found");
    }

    await prisma.review.upsert({
      where: {
        reviewerId_revieweeId: {
          reviewerId: input.reviewerId,
          revieweeId: input.revieweeId,
        },
      },
      create: {
        reviewerId: input.reviewerId,
        revieweeId: input.revieweeId,
        rating: input.rating,
        comment: input.comment?.trim() || null,
      },
      update: {
        rating: input.rating,
        comment: input.comment?.trim() || null,
      },
    });

    const aggregate = await prisma.review.aggregate({
      where: { revieweeId: input.revieweeId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.profile.update({
      where: { userId: input.revieweeId },
      data: {
        ratingAverage: aggregate._avg.rating ?? 0,
        ratingCount: aggregate._count.rating,
      },
    });

    const reviews = await this.listReviews(input.revieweeId, 1);
    const mine = reviews.find((review) => review.reviewerId === input.reviewerId);
    if (!mine) {
      throw new ForbiddenError("Failed to save review");
    }
    return mine;
  }

  async createShareLink(input: {
    ownerUserId: string;
    type: "PROFILE" | "TWIN_CHAT" | "KNOWLEDGE";
    targetId?: string | null;
    label?: string | null;
  }) {
    const token = cryptoRandomToken(12);
    return prisma.shareLink.create({
      data: {
        token,
        ownerUserId: input.ownerUserId,
        type: input.type,
        targetId: input.targetId ?? null,
        label: input.label ?? null,
      },
    });
  }

  async resolveShareLink(token: string) {
    const link = await prisma.shareLink.findUnique({ where: { token } });
    if (!link || !link.isActive) return null;
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return null;

    await prisma.shareLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    });

    return link;
  }
}

function cryptoRandomToken(size: number): string {
  return randomBytes(size).toString("base64url");
}
