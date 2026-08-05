import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonCreated, jsonError } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`onboarding:archetype:${session.user.id}`);
    const body: unknown = await request.json();
    const profile = await container.saveOnboardingArchetype.execute(
      session.user.id,
      body,
      { email: session.email },
    );
    return jsonCreated({ profile });
  } catch (error) {
    return jsonError(error);
  }
}
