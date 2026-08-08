import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request) ?? "anon";
    getRateLimiter().consume(`search:experts:${ip}`);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return jsonOk({ experts: [] });

    const result = await container.unifiedSearch.search({
      query: q,
      type: "people",
      sessionId: ip,
    });
    return jsonOk({ experts: result.experts, interpretedQuery: result.interpretedQuery });
  } catch (error) {
    return jsonError(error);
  }
}
