import { z } from "zod";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

const bodySchema = z.object({
  query: z.string().min(1).max(240),
  username: z.string().min(1).max(30),
  successType: z.enum([
    "profile_open",
    "ai_chat",
    "follow",
    "contact",
    "hire",
  ]),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request) ?? "anon";
    getRateLimiter().consume(`search:success:${ip}`);
    const body: unknown = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return jsonOk({ recorded: false });

    await container.unifiedSearch.recordClick(
      parsed.data.query,
      parsed.data.username,
      parsed.data.successType,
    );
    return jsonOk({ recorded: true });
  } catch (error) {
    return jsonError(error);
  }
}
