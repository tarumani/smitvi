import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { serializeUserGraph } from "@/application/graph/graph-api";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`graph:me:${session.user.id}`);
    const graph = await container.graph.getUserGraph(
      session.user.id,
      session.user.id,
    );
    return jsonOk({ graph: serializeUserGraph(graph) });
  } catch (error) {
    return jsonError(error);
  }
}
