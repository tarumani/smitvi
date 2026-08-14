import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonCreated, jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`marketplace:payouts:list:${session.user.id}`);
    const payouts = await container.creatorWallet.listPayouts(session.user.id);
    return jsonOk({ payouts });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`marketplace:payouts:create:${session.user.id}`);
    const result = await container.creatorWallet.requestPayout(session.user.id);
    return jsonCreated({
      payout: result.payout,
      amountCents: result.amountCents,
      currency: result.currency,
    });
  } catch (error) {
    return jsonError(error);
  }
}
