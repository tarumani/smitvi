import { z } from "zod";
import { requireAdmin } from "@/application/auth/require-admin";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const bodySchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "PAID", "FAILED", "ON_HOLD"]),
  externalRef: z.string().trim().max(120).optional().nullable(),
  failureReason: z.string().trim().max(500).optional().nullable(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Ops: update payout status (API only — no portal UI). */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;
    getRateLimiter().consume(`admin:payouts:patch:${session.user.id}`);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid payout update payload");
    }

    const { payout, becamePaid } =
      await container.creatorWallet.updatePayoutStatus(id, {
        status: parsed.data.status,
        externalRef: parsed.data.externalRef,
        failureReason: parsed.data.failureReason,
      });

    if (becamePaid) {
      void container.creatorPayoutPush
        .notifyPayoutPaid({
          userId: payout.userId,
          payoutId: payout.id,
          amountCents: payout.amountCents,
          currency: payout.currency,
        })
        .catch(() => undefined);
    }

    return jsonOk({ payout });
  } catch (error) {
    return jsonError(error);
  }
}
