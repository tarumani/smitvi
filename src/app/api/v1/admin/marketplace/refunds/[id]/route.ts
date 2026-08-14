import { z } from "zod";
import { requireAdmin } from "@/application/auth/require-admin";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const bodySchema = z.object({
  status: z.enum([
    "REQUESTED",
    "APPROVED",
    "REJECTED",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "DISPUTED",
  ]),
  /** Skip Stripe/Razorpay call (manual bank refund already done). */
  skipProvider: z.boolean().optional(),
  /** Override gross refund amount on COMPLETED (partial resolution). */
  amountCents: z.number().int().positive().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Ops: update refund status. COMPLETED refunds at Stripe/Razorpay then
 * reverses wallet credit (full revokes access). API only — no portal UI.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;
    getRateLimiter().consume(`admin:refunds:patch:${session.user.id}`);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("status required");
    }

    if (parsed.data.status === "COMPLETED") {
      const result = await container.marketplaceRefunds.completeRefund(id, {
        skipProvider: parsed.data.skipProvider === true,
        amountCents: parsed.data.amountCents,
      });
      return jsonOk(result);
    }

    const refund = await container.marketplaceRefunds.updateStatus(
      id,
      parsed.data.status,
      { amountCents: parsed.data.amountCents },
    );
    return jsonOk({ refund });
  } catch (error) {
    return jsonError(error);
  }
}
