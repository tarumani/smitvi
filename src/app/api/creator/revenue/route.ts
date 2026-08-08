import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const data = await container.monetizationAnalytics.getCreatorDashboard(
      session.user.id,
    );
    return jsonOk({ dashboard: data });
  } catch (error) {
    return jsonError(error);
  }
}
