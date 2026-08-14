import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

type RouteContext = {
  params: Promise<{ listingId: string }>;
};

/** Buyer preview for an unlocked library listing (API only — no portal UI). */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { listingId } = await context.params;
    getRateLimiter().consume(`marketplace:library:detail:${session.user.id}`);
    const detail = await container.library.getAccessDetail(
      session.user.id,
      listingId,
    );
    return jsonOk({ detail });
  } catch (error) {
    return jsonError(error);
  }
}
