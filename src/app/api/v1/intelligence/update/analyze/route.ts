import { requireSession } from "@/application/auth/get-current-session";
import { extractIntelligenceUpdate } from "@/application/intelligence/extract-intelligence-update";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`intelligence:analyze:${session.user.id}`);
    const body = (await request.json()) as { narrative?: string };
    const extraction = await extractIntelligenceUpdate(body.narrative ?? "");
    return jsonOk({ extraction });
  } catch (error) {
    return jsonError(error);
  }
}
