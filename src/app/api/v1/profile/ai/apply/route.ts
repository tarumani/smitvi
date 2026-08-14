import { requireSession } from "@/application/auth/get-current-session";
import { ApplyProfileAiDraft } from "@/application/onboarding/apply-profile-ai-draft";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`profile:ai:apply:${session.user.id}`);
    const body: unknown = await request.json();
    const result = await new ApplyProfileAiDraft().execute(
      session.user.id,
      body,
    );
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
