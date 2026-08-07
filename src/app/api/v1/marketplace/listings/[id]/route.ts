import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const updateSchema = z.object({
  type: z
    .enum([
      "CONSULTATION",
      "KNOWLEDGE_PACK",
      "EXPERT_SUBSCRIPTION",
      "SERVICE_PACKAGE",
      "TEMPLATE",
      "PROMPT_PACK",
    ])
    .optional(),
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  currency: z.string().trim().length(3).optional(),
  priceCents: z.number().int().min(100).optional(),
  durationMinutes: z.number().int().min(15).max(480).optional().nullable(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    getRateLimiter().consume(`marketplace:update:${session.user.id}`);

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid listing payload");
    }
    if (Object.keys(parsed.data).length === 0) {
      throw new ValidationError("No fields to update");
    }

    const listing = await container.marketplace.updateListing(
      id,
      session.user.id,
      parsed.data,
    );

    return jsonOk({ listing });
  } catch (error) {
    return jsonError(error);
  }
}
