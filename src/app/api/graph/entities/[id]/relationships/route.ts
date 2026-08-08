import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { NotFoundError } from "@/domain/shared/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    getRateLimiter().consume(`graph:entity:rels:${session.user.id}`);

    const entity = await container.graph.getEntity(id);
    if (!entity) throw new NotFoundError("Entity not found");
    await container.graph.assertEntityVisibleToViewer(entity, session.user.id);

    const relationships = await container.graphRepo.listOutgoingRelationships(
      id,
      { includeHidden: entity.ownerUserId === session.user.id },
    );

    return jsonOk({ relationships });
  } catch (error) {
    return jsonError(error);
  }
}
