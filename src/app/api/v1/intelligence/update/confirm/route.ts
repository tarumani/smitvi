import { requireSession } from "@/application/auth/get-current-session";
import { ConfirmIntelligenceUpdate } from "@/application/intelligence/confirm-intelligence-update";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`intelligence:confirm:${session.user.id}`);
    const body: unknown = await request.json();
    const result = await new ConfirmIntelligenceUpdate().execute(
      session.user.id,
      body,
    );
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
