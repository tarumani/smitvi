import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import {
  getClientIp,
  jsonCreated,
  jsonError,
  jsonOk,
} from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`profile:get:${session.user.id}`);
    const profile = await container.getMyProfile.execute(session.user.id);
    return jsonOk({ profile });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`profile:create:${session.user.id}`);
    const body: unknown = await request.json();
    const profile = await container.createProfile.execute(
      session.user.id,
      body,
      {
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      },
    );
    return jsonCreated({ profile });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`profile:update:${session.user.id}`);
    const body: unknown = await request.json();
    const profile = await container.updateProfile.execute(
      session.user.id,
      body,
      {
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      },
    );
    return jsonOk({ profile });
  } catch (error) {
    return jsonError(error);
  }
}
