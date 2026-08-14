import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

/** Mobile-facing alias of existing library access (Bearer). No portal UI. */
export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`marketplace:library:${session.user.id}`);
    const library = await container.library.listForUser(session.user.id);
    return jsonOk({ library });
  } catch (error) {
    return jsonError(error);
  }
}
