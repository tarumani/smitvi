import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { NotFoundError } from "@/domain/shared/errors";
import { prisma } from "@/infrastructure/database/prisma";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    getRateLimiter().consume(
      `conversations:get:${session.user.id}:${id}`,
    );

    const conversation = await container.conversations.getForUser(
      id,
      session.user.id,
    );
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: conversation.ownerUserId },
      select: {
        userId: true,
        displayName: true,
        username: true,
        avatarUrl: true,
      },
    });

    return jsonOk({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        ownerUserId: conversation.ownerUserId,
        updatedAt: conversation.updatedAt.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
        owner: {
          userId: conversation.ownerUserId,
          displayName: profile?.displayName ?? null,
          username: profile?.username ?? null,
          avatarUrl: profile?.avatarUrl ?? null,
        },
      },
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
