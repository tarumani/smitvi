import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`onboarding:complete:${session.user.id}`);
    const profile = await container.completeOnboarding.execute(session.user.id);
    return jsonOk({ profile });
  } catch (error) {
    return jsonError(error);
  }
}
