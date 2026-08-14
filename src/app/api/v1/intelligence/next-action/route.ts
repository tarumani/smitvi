import { requireSession } from "@/application/auth/get-current-session";
import { NextBestActionService } from "@/application/intelligence/next-best-action-service";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const data = await new NextBestActionService().generate(session.user.id);
    return jsonOk(data);
  } catch (error) {
    return jsonError(error);
  }
}
