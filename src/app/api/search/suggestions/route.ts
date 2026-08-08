import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request) ?? "anon";
    getRateLimiter().consume(`search:suggest:${ip}`);
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const suggestions = await container.unifiedSearch.suggestions(q);
    return jsonOk({ suggestions });
  } catch (error) {
    return jsonError(error);
  }
}
