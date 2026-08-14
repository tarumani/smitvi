import { z } from "zod";
import { requireAdmin } from "@/application/auth/require-admin";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import type { CreatorPayoutStatus } from "@/generated/prisma/enums";

const statusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "ON_HOLD",
]);

/** Ops: list marketplace payouts (API only — no portal UI). */
export async function GET(request: Request) {
  try {
    const session = await requireAdmin();
    getRateLimiter().consume(`admin:payouts:list:${session.user.id}`);

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    let status: CreatorPayoutStatus | undefined;
    if (statusParam) {
      const parsed = statusSchema.safeParse(statusParam);
      if (!parsed.success) throw new ValidationError("Invalid status filter");
      status = parsed.data;
    }

    const payouts = await container.creatorWallet.listPayoutsForAdmin({
      status,
      take: 50,
    });
    return jsonOk({ payouts });
  } catch (error) {
    return jsonError(error);
  }
}
