import type { PrismaPushDeviceRepository } from "@/infrastructure/database/repositories/push-device-repository";
import { sendExpoPushMessages } from "@/infrastructure/push/expo-push-client";

export class CreatorPayoutPushNotifier {
  constructor(private readonly pushDevices: PrismaPushDeviceRepository) {}

  async notifyPayoutPaid(input: {
    userId: string;
    payoutId: string;
    amountCents: number;
    currency: string;
  }): Promise<void> {
    const tokens = await this.pushDevices.listTokensForUser(input.userId);
    if (tokens.length === 0) return;

    const amount = `${(input.amountCents / 100).toFixed(2)} ${input.currency}`;

    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "Payout sent",
        body: `${amount} was marked paid · check your bank or wallet`,
        sound: "default",
        data: {
          type: "creator_payout_paid",
          payoutId: input.payoutId,
        },
      })),
    );
  }

  async notifyPendingSettled(input: {
    userId: string;
    settledCents: number;
    currency: string;
  }): Promise<void> {
    if (input.settledCents <= 0) return;
    const tokens = await this.pushDevices.listTokensForUser(input.userId);
    if (tokens.length === 0) return;

    const amount = `${(input.settledCents / 100).toFixed(2)} ${input.currency}`;

    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "Earnings available",
        body: `${amount} moved from pending to available`,
        sound: "default",
        data: {
          type: "creator_wallet_settled",
        },
      })),
    );
  }
}
