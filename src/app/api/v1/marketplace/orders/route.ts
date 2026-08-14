import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`marketplace:orders:${session.user.id}`);
    const orders = await container.marketplace.listOrdersForUser(session.user.id);
    const refundMap = await container.marketplaceRefunds.mapForOrders(
      orders.map((o) => o.id),
    );
    return jsonOk({
      orders: orders.map((o) => ({
        ...o,
        refund: refundMap.get(o.id) ?? null,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
