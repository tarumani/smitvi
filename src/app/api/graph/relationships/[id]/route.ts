import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { patchRelationshipBodySchema } from "@/application/graph/graph-api";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    getRateLimiter().consume(`graph:rel:patch:${session.user.id}`);

    const body: unknown = await request.json();
    const parsed = patchRelationshipBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid update payload");
    }

    let relationship = null;

    if (parsed.data.verificationStatus) {
      relationship = await container.graph.updateRelationshipVerification(
        id,
        session.user.id,
        parsed.data.verificationStatus,
      );
    } else if (parsed.data.confidenceScore != null) {
      relationship = await container.graph.updateRelationshipConfidence(
        id,
        parsed.data.confidenceScore,
        session.user.id,
      );
    }

    if (!relationship) throw new NotFoundError("Relationship not found");
    return jsonOk({ relationship });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    getRateLimiter().consume(`graph:rel:delete:${session.user.id}`);

    const ok = await container.graph.deleteRelationship(id, session.user.id);
    if (!ok) throw new NotFoundError("Relationship not found");
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
