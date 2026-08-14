import { requireSession } from "@/application/auth/get-current-session";
import { GetIntelligenceTimeline } from "@/application/intelligence/get-timeline";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const items = await new GetIntelligenceTimeline().execute(session.user.id);
    return jsonOk({ items });
  } catch (error) {
    return jsonError(error);
  }
}
