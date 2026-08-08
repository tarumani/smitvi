import { handlePostMessageApprove } from "@/application/growth/growth-admin-handlers";
import { jsonError } from "@/infrastructure/http/respond";

export async function POST(request: Request) {
  try {
    return handlePostMessageApprove(request);
  } catch (e) {
    return jsonError(e);
  }
}
