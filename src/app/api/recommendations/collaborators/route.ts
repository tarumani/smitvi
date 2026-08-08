import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const collaborators =
      await container.recommendations.recommendCollaborators(session.user.id);
    return jsonOk({ collaborators });
  } catch (error) {
    return jsonError(error);
  }
}
