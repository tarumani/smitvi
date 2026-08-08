import { prisma } from "@/infrastructure/database/prisma";
import type { TwinAccessMode } from "@/generated/prisma/client";

export class TwinMonetizationService {
  async getSettings(userId: string) {
    return prisma.twinMonetizationSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updateSettings(
    userId: string,
    input: Partial<{
      accessMode: TwinAccessMode;
      enabled: boolean;
      pricePerConversationCents: number | null;
      monthlySubscriptionCents: number | null;
      freeQuestionsPerDay: number;
      currency: string;
    }>,
  ) {
    return prisma.twinMonetizationSettings.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });
  }

  async hasActiveSubscription(creatorId: string, subscriberId: string) {
    const row = await prisma.twinCreatorSubscription.findFirst({
      where: {
        creatorId,
        subscriberId,
        status: "ACTIVE",
      },
    });
    return Boolean(row);
  }
}
