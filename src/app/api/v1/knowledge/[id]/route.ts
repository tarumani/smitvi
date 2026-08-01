import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { NotFoundError } from "@/domain/shared/errors";
import { deleteUpload } from "@/infrastructure/storage/object-storage";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    getRateLimiter().consume(`knowledge:get:${session.user.id}`);
    const source = await container.knowledge.findByIdForUser(
      id,
      session.user.id,
    );
    if (!source) throw new NotFoundError("Knowledge source not found");
    return jsonOk({ source });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    getRateLimiter().consume(`knowledge:delete:${session.user.id}`);

    const source = await container.knowledge.findByIdForUser(
      id,
      session.user.id,
    );
    if (!source) throw new NotFoundError("Knowledge source not found");

    await container.knowledge.deleteForUser(id, session.user.id);
    if (source.storagePath) {
      await deleteUpload(source.storagePath);
    }

    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
