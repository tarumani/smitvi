import type { PrismaPushDeviceRepository } from "@/infrastructure/database/repositories/push-device-repository";
import { sendExpoPushMessages } from "@/infrastructure/push/expo-push-client";

export class ConsultationRequestPushNotifier {
  constructor(private readonly pushDevices: PrismaPushDeviceRepository) {}

  async notifyNewRequest(input: {
    expertUserId: string;
    requestId: string;
    requesterName: string;
    messagePreview: string | null;
  }): Promise<void> {
    const tokens = await this.pushDevices.listTokensForUser(input.expertUserId);
    if (tokens.length === 0) return;

    const preview = (input.messagePreview ?? "").replace(/\s+/g, " ").trim();
    const detail =
      preview.length > 0
        ? preview.length > 100
          ? `${preview.slice(0, 97)}…`
          : preview
        : "Open the app to review details.";

    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "Consultation request",
        body: `${input.requesterName}: ${detail}`,
        sound: "default",
        data: {
          type: "consultation_request",
          requestId: input.requestId,
        },
      })),
    );
  }
}
