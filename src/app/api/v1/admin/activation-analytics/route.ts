import { requireAdmin } from "@/application/auth/require-admin";
import { GetActivationAnalytics } from "@/application/admin/get-activation-analytics";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    await requireAdmin();
    const result = await new GetActivationAnalytics().execute();
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
