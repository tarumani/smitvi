import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { serializeUserGraph } from "@/application/graph/graph-api";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id: targetUserId } = await params;
    getRateLimiter().consume(`graph:user:${session.user.id}`);

    const graph = await container.graph.getUserGraph(
      targetUserId,
      session.user.id,
    );
    return jsonOk({ graph: serializeUserGraph(graph) });
  } catch (error) {
    return jsonError(error);
  }
}
