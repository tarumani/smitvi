import { UnauthorizedError } from "@/domain/shared/errors";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

/**
 * Auto-settle marketplace pending → available after hold period.
 * Hold is per ledger credit (`creditedAt`), not wallet.updatedAt.
 * Default hold: CREATOR_PENDING_HOLD_DAYS or 7.
 */
export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return jsonError(new UnauthorizedError());
  }

  try {
    const holdDays = Number(process.env.CREATOR_PENDING_HOLD_DAYS ?? "7");
    const result = await container.creatorWallet.settleDuePending(
      Number.isFinite(holdDays) && holdDays > 0 ? holdDays : 7,
    );

    for (const row of result.settled) {
      void container.creatorPayoutPush
        .notifyPendingSettled({
          userId: row.userId,
          settledCents: row.settledCents,
          currency: row.currency,
        })
        .catch(() => undefined);
    }

    return jsonOk({ result });
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(request: Request) {
  return POST(request);
}
