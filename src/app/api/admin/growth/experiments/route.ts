import { handleGetExperiments } from "@/application/growth/growth-admin-handlers";
import { jsonError } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    return handleGetExperiments();
  } catch (e) {
    return jsonError(e);
  }
}
