import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const analytics =
      await container.monetizationAnalytics.getDetailedAnalytics(
        session.user.id,
      );
    return jsonOk({ analytics });
  } catch (error) {
    return jsonError(error);
  }
}
