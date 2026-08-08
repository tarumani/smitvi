import { z } from "zod";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

const querySchema = z.object({
  q: z.string().trim().min(2).max(200),
  type: z
    .enum([
      "all",
      "people",
      "knowledge",
      "projects",
      "skills",
      "companies",
      "topics",
      "questions",
    ])
    .optional(),
  limit: z.coerce.number().min(1).max(40).optional(),
});

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request) ?? "anon";
    getRateLimiter().consume(`search:unified:${ip}`);

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      q: url.searchParams.get("q") ?? "",
      type: url.searchParams.get("type") ?? "all",
      limit: url.searchParams.get("limit") ?? 20,
    });
    if (!parsed.success) {
      return jsonOk({ query: "", results: null });
    }

    const result = await container.unifiedSearch.search({
      query: parsed.data.q,
      type: parsed.data.type,
      limit: parsed.data.limit,
      sessionId: ip,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
