import { SaveOnboardingStep } from "@/application/onboarding/save-onboarding-step";
import { requireSession } from "@/application/auth/get-current-session";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`onboarding:step:${session.user.id}`);
    const body: unknown = await request.json();
    const result = await new SaveOnboardingStep().execute(
      session.user.id,
      session.email,
      body,
    );
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
