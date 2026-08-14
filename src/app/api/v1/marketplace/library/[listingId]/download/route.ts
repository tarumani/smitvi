import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

type RouteContext = {
  params: Promise<{ listingId: string }>;
};

/**
 * Mint a short-lived download URL for unlocked library content.
 * Prefer Supabase signed URL; otherwise HMAC stream URL.
 * API only — no portal UI.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { listingId } = await context.params;
    getRateLimiter().consume(
      `marketplace:library:download:${session.user.id}`,
    );
    const download = await container.library.createDownloadLink(
      session.user.id,
      listingId,
    );
    return jsonOk({ download });
  } catch (error) {
    return jsonError(error);
  }
}
