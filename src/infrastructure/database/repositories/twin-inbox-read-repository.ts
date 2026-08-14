import { prisma } from "@/infrastructure/database/prisma";

export class PrismaTwinInboxReadRepository {
  async getReadAtByConversation(userId: string): Promise<Map<string, Date>> {
    const rows = await prisma.twinInboxRead.findMany({
      where: { userId },
      select: { conversationId: true, readAt: true },
    });
    return new Map(rows.map((row) => [row.conversationId, row.readAt]));
  }

  isConversationRead(
    conversationId: string,
    conversationUpdatedAt: Date,
    readAtByConversation: Map<string, Date>,
  ): boolean {
    const readAt = readAtByConversation.get(conversationId);
    if (!readAt) return false;
    return readAt >= conversationUpdatedAt;
  }

  async markRead(userId: string, conversationIds: string[]): Promise<number> {
    if (conversationIds.length === 0) return 0;
    const now = new Date();
    await Promise.all(
      conversationIds.map((conversationId) =>
        prisma.twinInboxRead.upsert({
          where: {
            userId_conversationId: { userId, conversationId },
          },
          create: { userId, conversationId, readAt: now },
          update: { readAt: now },
        }),
      ),
    );
    return conversationIds.length;
  }
}
