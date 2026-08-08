import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`rec:experts:${session.user.id}`);
    const experts = await container.recommendations.recommendExperts(
      session.user.id,
    );
    return jsonOk({ experts });
  } catch (error) {
    return jsonError(error);
  }
}
