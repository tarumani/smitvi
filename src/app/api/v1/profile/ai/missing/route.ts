import { requireSession } from "@/application/auth/get-current-session";
import { ApplyMissingAnswers } from "@/application/onboarding/apply-missing-answers";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`profile:ai:missing:${session.user.id}`);
    const body: unknown = await request.json();
    const result = await new ApplyMissingAnswers().execute(
      session.user.id,
      body,
    );
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
