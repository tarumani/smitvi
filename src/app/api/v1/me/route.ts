import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`me:get:${session.user.id}`);

    const profile = await container.getMyProfile.execute(session.user.id);

    return jsonOk({
      authUserId: session.authUserId,
      email: session.email,
      user: session.user,
      profileSummary: session.profile,
      profile,
    });
  } catch (error) {
    return jsonError(error);
  }
}
