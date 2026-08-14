import { requireSession } from "@/application/auth/get-current-session";
import { NextBestActionService } from "@/application/intelligence/next-best-action-service";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const data = await new NextBestActionService().complete(
      session.user.id,
      id,
    );
    return jsonOk({ action: data });
  } catch (error) {
    return jsonError(error);
  }
}
