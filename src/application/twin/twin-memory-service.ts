import type { PrismaConversationRepository } from "@/infrastructure/database/repositories/conversation-repository";

/** Conversation memory — not promoted to verified graph facts. */
export class TwinMemoryService {
  constructor(private readonly conversations: PrismaConversationRepository) {}

  async getRecentContext(
    conversationId: string,
    userId: string,
    limit = 6,
  ): Promise<string | null> {
    const conv = await this.conversations.getForUser(conversationId, userId);
    if (!conv?.messages?.length) return null;

    const recent = conv.messages.slice(-limit);
    return recent
      .map((m) => `${m.role}: ${m.content.slice(0, 400)}`)
      .join("\n");
  }
}
