import { z } from "zod";
import { requireAdmin } from "@/application/auth/require-admin";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const bodySchema = z.object({
  userId: z.string().uuid(),
  amountCents: z.number().int().positive().optional(),
});

/**
 * Ops: move seller pending balance → available (API only — no portal UI).
 * Call after hold period / manual review.
 */
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    getRateLimiter().consume(`admin:wallet:settle:${session.user.id}`);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("userId (uuid) required");
    }

    const { wallet, settledCents } =
      await container.creatorWallet.releasePendingToAvailable(
        parsed.data.userId,
        parsed.data.amountCents,
      );

    if (settledCents > 0) {
      void container.creatorPayoutPush
        .notifyPendingSettled({
          userId: parsed.data.userId,
          settledCents,
          currency: wallet.currency,
        })
        .catch(() => undefined);
    }

    return jsonOk({
      wallet,
      settledCents,
    });
  } catch (error) {
    return jsonError(error);
  }
}
