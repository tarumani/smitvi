import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request) ?? "anon";
    getRateLimiter().consume(`search:skills:${ip}`);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return jsonOk({ skills: [] });
    const legacy = await container.search.search(q, 10);
    return jsonOk({ skills: legacy.skills });
  } catch (error) {
    return jsonError(error);
  }
}
