import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonCreated, jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const createSchema = z.object({
  type: z.enum([
    "CONSULTATION",
    "KNOWLEDGE_PACK",
    "EXPERT_SUBSCRIPTION",
    "SERVICE_PACKAGE",
    "TEMPLATE",
    "PROMPT_PACK",
  ]),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(2000),
  currency: z.string().trim().length(3).default("USD"),
  priceCents: z.number().int().min(100),
  durationMinutes: z.number().int().min(15).max(480).optional().nullable(),
});

export async function GET() {
  try {
    const listings = await container.marketplace.listActive();
    return jsonOk({ listings });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`marketplace:create:${session.user.id}`);

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid listing payload");
    }

    const listing = await container.marketplace.createListing({
      sellerId: session.user.id,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      currency: parsed.data.currency,
      priceCents: parsed.data.priceCents,
      durationMinutes: parsed.data.durationMinutes,
      status: "ACTIVE",
    });

    return jsonCreated({ listing });
  } catch (error) {
    return jsonError(error);
  }
}
