import { requireSession } from "@/application/auth/get-current-session";
import { UpdateDiscoverability } from "@/application/onboarding/update-discoverability";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body: unknown = await request.json();
    const result = await new UpdateDiscoverability().execute(
      session.user.id,
      body,
    );
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
