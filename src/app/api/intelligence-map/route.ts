import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`intel-map:${session.user.id}`);
    const map = await container.intelligenceMap.buildForUser(session.user.id);
    return jsonOk({ map });
  } catch (error) {
    return jsonError(error);
  }
}
