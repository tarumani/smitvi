import { requirePrivilegedAdmin } from "@/application/auth/require-admin";
import { container } from "@/application/container";
import { NotFoundError } from "@/domain/shared/errors";
import { deleteUpload } from "@/infrastructure/storage/object-storage";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requirePrivilegedAdmin();
    const { id } = await context.params;

    const source = await container.knowledge.findByIdForAdmin(id);
    if (!source) {
      throw new NotFoundError("Knowledge source not found");
    }

    await container.knowledge.deleteById(id);
    if (source.storagePath) {
      try {
        await deleteUpload(source.storagePath);
      } catch (error) {
        console.error("[admin] storage cleanup failed", error);
      }
    }

    return jsonOk({ deleted: true, id });
  } catch (error) {
    return jsonError(error);
  }
}
