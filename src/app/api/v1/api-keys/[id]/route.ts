import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    await container.apiKeys.revoke(id, session.user.id);
    await new PrismaAuditLogRepository().create({
      actorId: session.user.id,
      action: "API_KEY_REVOKED",
      entityType: "api_key",
      entityId: id,
    });
    return jsonOk({ revoked: true });
  } catch (error) {
    return jsonError(error);
  }
}
