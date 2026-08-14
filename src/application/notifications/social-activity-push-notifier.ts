import type { PrismaProfileRepository } from "@/infrastructure/database/repositories/profile-repository";
import type { PrismaPushDeviceRepository } from "@/infrastructure/database/repositories/push-device-repository";
import { sendExpoPushMessages } from "@/infrastructure/push/expo-push-client";

export class SocialActivityPushNotifier {
  constructor(
    private readonly pushDevices: PrismaPushDeviceRepository,
    private readonly profiles: PrismaProfileRepository,
  ) {}

  async notifyNewFollower(input: {
    hubOwnerUserId: string;
    followerUserId: string;
  }): Promise<void> {
    if (input.hubOwnerUserId === input.followerUserId) return;

    const tokens = await this.pushDevices.listTokensForUser(
      input.hubOwnerUserId,
    );
    if (tokens.length === 0) return;

    const follower = await this.profiles.findSummaryByUserId(
      input.followerUserId,
    );
    const name =
      follower?.displayName ??
      (follower?.username ? `@${follower.username}` : "Someone");
    const username = follower?.username ?? "";

    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "New follower",
        body: `${name} followed your Intelligence Hub`,
        sound: "default",
        data: {
          type: "follow",
          username,
        },
      })),
    );
  }

  async notifyNewReview(input: {
    revieweeUserId: string;
    reviewerUserId: string;
    rating: number;
    reviewerUsername: string;
    reviewerName: string;
  }): Promise<void> {
    if (input.revieweeUserId === input.reviewerUserId) return;

    const tokens = await this.pushDevices.listTokensForUser(
      input.revieweeUserId,
    );
    if (tokens.length === 0) return;

    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "New review",
        body: `${input.reviewerName} left ${input.rating}★ on your hub`,
        sound: "default",
        data: {
          type: "review",
          username: input.reviewerUsername,
        },
      })),
    );
  }
}
