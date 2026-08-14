import { requireSession } from "@/application/auth/get-current-session";
import { SetProfileType } from "@/application/onboarding/start-profile-onboarding";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`profile:type:${session.user.id}`);
    const body = (await request.json()) as { profileType?: string };
    const result = await new SetProfileType().execute(
      session.user.id,
      session.email,
      body.profileType ?? "",
    );
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
