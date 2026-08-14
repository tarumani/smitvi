import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

/** Mobile-facing creator wallet (Bearer). No portal UI. */
export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`marketplace:wallet:${session.user.id}`);
    const summary = await container.creatorWallet.getWalletSummary(
      session.user.id,
    );
    return jsonOk(summary);
  } catch (error) {
    return jsonError(error);
  }
}
