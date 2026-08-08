import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request) ?? "anon";
    getRateLimiter().consume(`search:knowledge:${ip}`);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return jsonOk({ knowledge: [] });

    const result = await container.unifiedSearch.search({
      query: q,
      type: "knowledge",
      sessionId: ip,
    });
    return jsonOk({ knowledge: result.knowledge });
  } catch (error) {
    return jsonError(error);
  }
}
