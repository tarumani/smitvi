import type { PrismaProfileRepository } from "@/infrastructure/database/repositories/profile-repository";
import type { PrismaPushDeviceRepository } from "@/infrastructure/database/repositories/push-device-repository";
import { sendExpoPushMessages } from "@/infrastructure/push/expo-push-client";

export class TwinInboxPushNotifier {
  constructor(
    private readonly pushDevices: PrismaPushDeviceRepository,
    private readonly profiles: PrismaProfileRepository,
  ) {}

  async notifyVisitorQuestion(input: {
    ownerUserId: string;
    visitorUserId: string;
    conversationId: string;
    questionPreview: string;
  }): Promise<void> {
    const tokens = await this.pushDevices.listTokensForUser(input.ownerUserId);
    if (tokens.length === 0) return;

    const visitor = await this.profiles.findSummaryByUserId(input.visitorUserId);
    const name =
      visitor?.displayName ??
      (visitor?.username ? `@${visitor.username}` : "Someone");
    const preview = input.questionPreview.replace(/\s+/g, " ").trim();
    const body =
      preview.length > 120 ? `${preview.slice(0, 117)}…` : preview;

    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "New Twin question",
        body: `${name}: ${body}`,
        sound: "default",
        data: {
          type: "twin_inbox",
          conversationId: input.conversationId,
        },
      })),
    );
  }
}
