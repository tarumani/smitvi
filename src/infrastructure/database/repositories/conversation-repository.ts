import { prisma } from "@/infrastructure/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type ConversationSummary = {
  id: string;
  title: string | null;
  updatedAt: Date;
  createdAt: Date;
};

export type ConversationMessageEntity = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  confidence: number | null;
  citations: unknown;
  createdAt: Date;
};

export type TwinInboxItem = {
  id: string;
  title: string | null;
  updatedAt: Date;
  createdAt: Date;
  messageCount: number;
  lastMessage: {
    role: "USER" | "ASSISTANT" | "SYSTEM";
    content: string;
    createdAt: Date;
  } | null;
  visitor: {
    userId: string;
    email: string;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
};

export class PrismaConversationRepository {
  async listForUser(userId: string): Promise<ConversationSummary[]> {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
      },
      take: 50,
    });
  }

  /** Conversations where others chatted with this user's Twin. */
  async listInboxForOwner(ownerUserId: string): Promise<TwinInboxItem[]> {
    const rows = await prisma.conversation.findMany({
      where: {
        ownerUserId,
        userId: { not: ownerUserId },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            role: true,
            content: true,
            createdAt: true,
          },
        },
        _count: { select: { messages: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      messageCount: row._count.messages,
      lastMessage: row.messages[0]
        ? {
            role: row.messages[0].role,
            content: row.messages[0].content,
            createdAt: row.messages[0].createdAt,
          }
        : null,
      visitor: {
        userId: row.user.id,
        email: row.user.email,
        displayName: row.user.profile?.displayName ?? null,
        username: row.user.profile?.username ?? null,
        avatarUrl: row.user.profile?.avatarUrl ?? null,
      },
    }));
  }

  async getForOwner(conversationId: string, ownerUserId: string) {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        ownerUserId,
        userId: { not: ownerUserId },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                username: true,
                avatarUrl: true,
                headline: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async create(input: {
    userId: string;
    ownerUserId: string;
    title?: string;
    visibility?: "PRIVATE" | "PUBLIC";
    organizationId?: string | null;
  }): Promise<ConversationSummary> {
    return prisma.conversation.create({
      data: {
        userId: input.userId,
        ownerUserId: input.ownerUserId,
        organizationId: input.organizationId ?? null,
        title: input.title,
        visibility: input.visibility ?? "PRIVATE",
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
      },
    });
  }

  async getForUser(conversationId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async addMessage(input: {
    conversationId: string;
    role: "USER" | "ASSISTANT" | "SYSTEM";
    content: string;
    confidence?: number | null;
    citations?: Prisma.InputJsonValue;
  }): Promise<ConversationMessageEntity> {
    const message = await prisma.conversationMessage.create({
      data: {
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        confidence: input.confidence ?? null,
        citations: input.citations,
      },
    });

    await prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        updatedAt: new Date(),
        title:
          input.role === "USER"
            ? undefined
            : undefined,
      },
    });

    if (input.role === "USER") {
      const conversation = await prisma.conversation.findUnique({
        where: { id: input.conversationId },
        select: { title: true },
      });
      if (!conversation?.title) {
        await prisma.conversation.update({
          where: { id: input.conversationId },
          data: { title: input.content.slice(0, 80) },
        });
      }
    }

    return {
      id: message.id,
      role: message.role,
      content: message.content,
      confidence: message.confidence,
      citations: message.citations,
      createdAt: message.createdAt,
    };
  }

  async incrementDailyUsage(userId: string): Promise<number> {
    const usageDate = new Date();
    usageDate.setUTCHours(0, 0, 0, 0);

    const row = await prisma.chatUsageDaily.upsert({
      where: {
        userId_usageDate: {
          userId,
          usageDate,
        },
      },
      create: {
        userId,
        usageDate,
        messageCount: 1,
      },
      update: {
        messageCount: { increment: 1 },
      },
    });

    return row.messageCount;
  }

  async getDailyUsage(userId: string): Promise<number> {
    const usageDate = new Date();
    usageDate.setUTCHours(0, 0, 0, 0);
    const row = await prisma.chatUsageDaily.findUnique({
      where: {
        userId_usageDate: {
          userId,
          usageDate,
        },
      },
    });
    return row?.messageCount ?? 0;
  }

  async countAll(): Promise<number> {
    return prisma.conversation.count();
  }

  async countInboxForOwner(ownerUserId: string): Promise<number> {
    return prisma.conversation.count({
      where: {
        ownerUserId,
        userId: { not: ownerUserId },
      },
    });
  }
}
