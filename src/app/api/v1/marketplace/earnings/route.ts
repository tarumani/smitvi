import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`marketplace:earnings:${session.user.id}`);

    const userId = session.user.id;
    const [lifetimeNetCents, monthNetCents, byCurrency] = await Promise.all([
      container.marketplace.sumSellerNetEarningsCents(userId),
      container.marketplace.sumSellerNetEarningsThisMonthCents(userId),
      container.marketplace.sumSellerNetEarningsByCurrency(userId),
    ]);

    return jsonOk({
      earnings: {
        /** Legacy single-bucket total (sums all currencies — display byCurrency when mixed). */
        currency: byCurrency.length === 1 ? byCurrency[0]!.currency : "MIXED",
        lifetimeNetCents,
        monthNetCents,
        byCurrency,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
