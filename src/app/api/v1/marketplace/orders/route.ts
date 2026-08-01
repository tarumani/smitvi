import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`marketplace:orders:${session.user.id}`);
    const orders = await container.marketplace.listOrdersForUser(session.user.id);
    return jsonOk({ orders });
  } catch (error) {
    return jsonError(error);
  }
}
