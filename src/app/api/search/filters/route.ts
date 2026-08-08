import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    getRateLimiter().consume(`search:filters:${getClientIp(request) ?? "anon"}`);
    return jsonOk({ filters: container.unifiedSearch.getFilters() });
  } catch (error) {
    return jsonError(error);
  }
}
