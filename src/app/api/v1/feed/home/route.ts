import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request) ?? "anon";
    getRateLimiter().consume(`feed:home:${ip}`);

    const session = await getCurrentSession();
    const network = await container.getNetworkHome.execute();

    if (!session) {
      return jsonOk({
        network,
        forYou: null,
        authenticated: false,
      });
    }

    getRateLimiter().consume(`feed:home:user:${session.user.id}`);

    const forYou = await container.recommendations.getForYouFeed(
      session.user.id,
    );

    return jsonOk({
      network,
      forYou,
      authenticated: true,
    });
  } catch (error) {
    return jsonError(error);
  }
}
