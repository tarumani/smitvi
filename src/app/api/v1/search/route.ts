import { z } from "zod";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

const querySchema = z.object({
  q: z.string().trim().min(2).max(120),
});

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request) ?? "anon";
    getRateLimiter().consume(`search:${ip}`);

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({ q: url.searchParams.get("q") ?? "" });
    if (!parsed.success) {
      throw new ValidationError("Search query must be at least 2 characters");
    }

    const results = await container.search.search(parsed.data.q);
    return jsonOk({ query: parsed.data.q, results });
  } catch (error) {
    return jsonError(error);
  }
}
