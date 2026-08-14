import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

const bodySchema = z.object({
  reason: z.string().trim().max(500).optional().nullable(),
  /** Gross cents; omit for full refund. */
  amountCents: z.number().int().positive().optional().nullable(),
  kind: z.enum(["FULL", "PARTIAL", "DISPUTE"]).optional(),
});

/** Buyer: get refund status for an order (API only — no portal UI). */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { orderId } = await context.params;
    getRateLimiter().consume(`marketplace:refund:get:${session.user.id}`);

    const owned = await container.marketplaceRefunds.getOrderForParticipant(
      orderId,
      session.user.id,
    );
    if (!owned) {
      throw new ValidationError("Order not found");
    }

    const refund = await container.marketplaceRefunds.getForOrder(orderId);
    return jsonOk({ refund });
  } catch (error) {
    return jsonError(error);
  }
}

/** Buyer: request full/partial refund or open a dispute (API only — no portal UI). */
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { orderId } = await context.params;
    getRateLimiter().consume(`marketplace:refund:post:${session.user.id}`);

    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError("Invalid refund payload");
    }

    const refund = await container.marketplaceRefunds.requestRefund({
      buyerId: session.user.id,
      orderId,
      reason: parsed.data.reason,
      amountCents: parsed.data.amountCents,
      kind: parsed.data.kind,
    });

    return jsonOk({ refund });
  } catch (error) {
    return jsonError(error);
  }
}
