import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`rec:all:${session.user.id}`);
    const [bundle, forYou] = await Promise.all([
      container.recommendations.getBundle(session.user.id),
      container.recommendations.getForYouFeed(session.user.id),
    ]);
    return jsonOk({ bundle, forYou });
  } catch (error) {
    return jsonError(error);
  }
}
