import { requireSession } from "@/application/auth/get-current-session";
import { ImproveProfileWithAi } from "@/application/onboarding/improve-profile-with-ai";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`profile:ai:improve:${session.user.id}`);
    const body = (await request.json().catch(() => ({}))) as {
      narrative?: string;
    };
    const result = await new ImproveProfileWithAi().execute(
      session.user.id,
      session.email,
      body.narrative,
    );
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
