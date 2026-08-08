import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const listing = await container.productPublish.publish(id, session.user.id);
    return jsonOk({ listing });
  } catch (error) {
    return jsonError(error);
  }
}
