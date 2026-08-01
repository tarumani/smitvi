import { container } from "@/application/container";
import { jsonError, jsonOk, getClientIp } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request) ?? "anon";
    getRateLimiter().consume(`discover:${ip}`);

    const [trendingExperts, newExperts, trendingTopics] = await Promise.all([
      container.search.trendingExperts(),
      container.search.newExperts(),
      container.search.trendingTopics(),
    ]);

    return jsonOk({
      trendingExperts,
      newExperts,
      trendingTopics,
      trendingQuestions: [],
      featuredCreators: trendingExperts.slice(0, 4),
    });
  } catch (error) {
    return jsonError(error);
  }
}
