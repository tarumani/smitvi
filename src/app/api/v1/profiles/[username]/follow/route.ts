import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { NotFoundError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

type RouteContext = { params: Promise<{ username: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { username } = await context.params;
    getRateLimiter().consume(`follow:${session.user.id}`);

    const profile = await container.profiles.findByUsername(username);
    if (!profile || profile.visibility === "PRIVATE") {
      throw new NotFoundError("Profile not found");
    }

    await container.social.follow(session.user.id, profile.userId);
    await container.profiles.findByUsername(username);

    return jsonOk({ following: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { username } = await context.params;
    getRateLimiter().consume(`unfollow:${session.user.id}`);

    const profile = await container.profiles.findByUsername(username);
    if (!profile) throw new NotFoundError("Profile not found");

    await container.social.unfollow(session.user.id, profile.userId);
    return jsonOk({ following: false });
  } catch (error) {
    return jsonError(error);
  }
}
