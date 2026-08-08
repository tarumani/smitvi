import { handleGetReports } from "@/application/growth/growth-admin-handlers";
import { jsonError } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    return handleGetReports(request);
  } catch (e) {
    return jsonError(e);
  }
}
