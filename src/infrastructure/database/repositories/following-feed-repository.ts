import { prisma } from "@/infrastructure/database/prisma";

export type FollowingFeedItem = {
  id: string;
  kind: "knowledge" | "offer";
  title: string;
  detail: string | null;
  occurredAt: Date;
  expert: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

const FEED_DAYS = 21;

export class PrismaFollowingFeedRepository {
  async listForFollower(
    followerId: string,
    limit = 24,
  ): Promise<FollowingFeedItem[]> {
    const follows = await prisma.follow.findMany({
      where: { followerId },
      select: { followingId: true },
    });
    const followingIds = follows.map((row) => row.followingId);
    if (followingIds.length === 0) return [];

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - FEED_DAYS);

    const profileSelect = {
      select: {
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    } as const;

    const [knowledgeRows, listingRows] = await Promise.all([
      prisma.knowledgeSource.findMany({
        where: {
          userId: { in: followingIds },
          organizationId: null,
          status: "READY",
          isPublic: true,
          updatedAt: { gte: since },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        include: {
          user: { include: { profile: profileSelect } },
        },
      }),
      prisma.marketplaceListing.findMany({
        where: {
          sellerId: { in: followingIds },
          status: "ACTIVE",
          createdAt: { gte: since },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          seller: { include: { profile: profileSelect } },
        },
      }),
    ]);

    const items: FollowingFeedItem[] = [];

    for (const row of knowledgeRows) {
      const profile = row.user.profile;
      if (!profile) continue;
      items.push({
        id: `knowledge-${row.id}`,
        kind: "knowledge",
        title: row.title,
        detail: row.summary,
        occurredAt: row.updatedAt,
        expert: {
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        },
      });
    }

    for (const row of listingRows) {
      const profile = row.seller.profile;
      if (!profile) continue;
      items.push({
        id: `offer-${row.id}`,
        kind: "offer",
        title: row.title,
        detail: row.description,
        occurredAt: row.createdAt,
        expert: {
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        },
      });
    }

    return items
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, limit);
  }

  async listForFollowerSince(
    followerId: string,
    since: Date,
    limit = 12,
  ): Promise<FollowingFeedItem[]> {
    const all = await this.listForFollower(followerId, limit * 3);
    return all
      .filter((item) => item.occurredAt.getTime() >= since.getTime())
      .slice(0, limit);
  }
}
