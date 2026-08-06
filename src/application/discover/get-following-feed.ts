import type { FollowingFeedItem } from "@/infrastructure/database/repositories/following-feed-repository";
import { PrismaFollowingFeedRepository } from "@/infrastructure/database/repositories/following-feed-repository";

export class GetFollowingFeed {
  constructor(
    private readonly feed: PrismaFollowingFeedRepository = new PrismaFollowingFeedRepository(),
  ) {}

  execute(followerId: string, limit = 24): Promise<FollowingFeedItem[]> {
    return this.feed.listForFollower(followerId, limit);
  }
}

export type { FollowingFeedItem };
