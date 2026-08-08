import { z } from "zod";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

const bodySchema = z.object({
  query: z.string().trim().min(2).max(200),
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
    .optional()
    .default("all"),
  limit: z.number().min(1).max(40).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request) ?? "anon";
    getRateLimiter().consume(`search:query:${ip}`);

    const body: unknown = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid search query");
    }

    const result = await container.unifiedSearch.search({
      query: parsed.data.query,
      type: parsed.data.type,
      limit: parsed.data.limit ?? 20,
      filters: parsed.data.filters,
      sessionId: ip,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
