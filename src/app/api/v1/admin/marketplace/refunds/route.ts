import { requireAdmin } from "@/application/auth/require-admin";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import type { MarketplaceRefundStatus } from "@/generated/prisma/enums";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const STATUSES = [
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "DISPUTED",
] as const satisfies readonly MarketplaceRefundStatus[];

/** Ops: list marketplace refunds (API only — no portal UI). */
export async function GET(request: Request) {
  try {
    const session = await requireAdmin();
    getRateLimiter().consume(`admin:refunds:${session.user.id}`);

    const statusParam = new URL(request.url).searchParams.get("status");
    let status: MarketplaceRefundStatus | undefined;
    if (statusParam) {
      if (!(STATUSES as readonly string[]).includes(statusParam)) {
        throw new ValidationError("Invalid status filter");
      }
      status = statusParam as MarketplaceRefundStatus;
    }

    const refunds = await container.marketplaceRefunds.listForAdmin({ status });
    return jsonOk({ refunds });
  } catch (error) {
    return jsonError(error);
  }
}
