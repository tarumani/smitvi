import { handleGetAnalytics } from "@/application/growth/growth-admin-handlers";
import { jsonError } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    return handleGetAnalytics();
  } catch (e) {
    return jsonError(e);
  }
}
