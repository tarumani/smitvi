import { prisma } from "@/infrastructure/database/prisma";

export class PrismaPushDeviceRepository {
  async upsert(input: {
    userId: string;
    expoPushToken: string;
    platform?: string | null;
  }) {
    return prisma.pushDevice.upsert({
      where: {
        userId_expoPushToken: {
          userId: input.userId,
          expoPushToken: input.expoPushToken,
        },
      },
      create: {
        userId: input.userId,
        expoPushToken: input.expoPushToken,
        platform: input.platform ?? null,
      },
      update: {
        platform: input.platform ?? null,
        updatedAt: new Date(),
      },
    });
  }

  async revoke(userId: string, expoPushToken: string): Promise<number> {
    const result = await prisma.pushDevice.deleteMany({
      where: { userId, expoPushToken },
    });
    return result.count;
  }

  async listTokensForUser(userId: string): Promise<string[]> {
    const rows = await prisma.pushDevice.findMany({
      where: { userId },
      select: { expoPushToken: true },
    });
    return rows.map((row) => row.expoPushToken);
  }
}
