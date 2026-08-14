import { prisma } from "@/infrastructure/database/prisma";

export class PrismaSocialActivityReadRepository {
  async getReadKeys(userId: string): Promise<Set<string>> {
    const rows = await prisma.socialActivityRead.findMany({
      where: { userId },
      select: { activityKey: true },
    });
    return new Set(rows.map((row) => row.activityKey));
  }

  isRead(activityKey: string, readKeys: Set<string>): boolean {
    return readKeys.has(activityKey);
  }

  async markRead(userId: string, activityKeys: string[]): Promise<number> {
    const unique = [...new Set(activityKeys.filter(Boolean))];
    if (unique.length === 0) return 0;
    const now = new Date();
    await Promise.all(
      unique.map((activityKey) =>
        prisma.socialActivityRead.upsert({
          where: {
            userId_activityKey: { userId, activityKey },
          },
          create: { userId, activityKey, readAt: now },
          update: { readAt: now },
        }),
      ),
    );
    return unique.length;
  }
}
