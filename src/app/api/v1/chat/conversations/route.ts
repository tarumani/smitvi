import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonCreated, jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`conversations:list:${session.user.id}`);
    const conversations = await container.conversations.listForUser(
      session.user.id,
    );
    return jsonOk({ conversations });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`conversations:create:${session.user.id}`);
    const conversation = await container.conversations.create({
      userId: session.user.id,
      ownerUserId: session.user.id,
    });
    return jsonCreated({ conversation });
  } catch (error) {
    return jsonError(error);
  }
}
