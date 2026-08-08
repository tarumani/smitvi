import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const bundle = await container.recommendations.getBundle(session.user.id);
    return jsonOk({ opportunities: bundle.opportunities });
  } catch (error) {
    return jsonError(error);
  }
}
