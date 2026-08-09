import { container } from "@/application/container";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request) ?? "anon";
    getRateLimiter().consume(`network:home:${ip}`);

    const network = await container.getNetworkHome.execute();
    return jsonOk(network);
  } catch (error) {
    return jsonError(error);
  }
}
