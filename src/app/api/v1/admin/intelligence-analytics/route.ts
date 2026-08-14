import { requireAdmin } from "@/application/auth/require-admin";
import { GetIntelligenceAnalytics } from "@/application/admin/get-intelligence-analytics";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    await requireAdmin();
    const data = await new GetIntelligenceAnalytics().execute();
    return jsonOk(data);
  } catch (error) {
    return jsonError(error);
  }
}
