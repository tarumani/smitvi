import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`inbox:twin:${session.user.id}`);

    const items = await container.conversations.listInboxForOwner(
      session.user.id,
    );

    return jsonOk({
      inbox: items.map((item) => ({
        id: item.id,
        title: item.title,
        updatedAt: item.updatedAt.toISOString(),
        createdAt: item.createdAt.toISOString(),
        messageCount: item.messageCount,
        lastMessage: item.lastMessage
          ? {
              role: item.lastMessage.role,
              content: item.lastMessage.content,
              createdAt: item.lastMessage.createdAt.toISOString(),
            }
          : null,
        visitor: item.visitor,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
