import { requireSession } from "@/application/auth/get-current-session";
import { StartProfileOnboarding } from "@/application/onboarding/start-profile-onboarding";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`profile:onboarding:${session.user.id}`);
    const result = await new StartProfileOnboarding().execute(
      session.user.id,
      session.email,
    );
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
