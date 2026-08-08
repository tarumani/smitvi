import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const mentors = await container.recommendations.recommendMentors(
      session.user.id,
    );
    return jsonOk({ mentors });
  } catch (error) {
    return jsonError(error);
  }
}
