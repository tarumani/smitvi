import { requireSession } from "@/application/auth/get-current-session";
import { resolveReferrerUsername } from "@/application/referral/resolve-referrer";
import { container } from "@/application/container";
import { jsonCreated, jsonError } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { cookies } from "next/headers";
import { REFERRAL_COOKIE_NAME } from "@/lib/referral";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`onboarding:archetype:${session.user.id}`);
    const body: unknown = await request.json();
    const cookieStore = await cookies();
    const rawRef = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
    const referrerUsername = await resolveReferrerUsername(
      rawRef,
      session.user.id,
    );
    const profile = await container.saveOnboardingArchetype.execute(
      session.user.id,
      body,
      { email: session.email, referrerUsername },
    );
    return jsonCreated({ profile });
  } catch (error) {
    return jsonError(error);
  }
}
