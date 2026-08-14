import { requireSession } from "@/application/auth/get-current-session";
import { GenerateProjectFromNarrative } from "@/application/onboarding/generate-project-from-narrative";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`profile:project:ai:${session.user.id}`);
    const body = (await request.json()) as {
      narrative?: string;
      save?: boolean;
    };
    const result = await new GenerateProjectFromNarrative().execute(
      session.user.id,
      body.narrative ?? "",
      Boolean(body.save),
    );
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
