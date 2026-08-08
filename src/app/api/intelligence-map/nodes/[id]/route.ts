import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const detail = await container.intelligenceMap.getNodeDetail(
      session.user.id,
      decodeURIComponent(id),
    );
    if (!detail) {
      return jsonOk({ detail: null });
    }
    return jsonOk({ detail });
  } catch (error) {
    return jsonError(error);
  }
}
