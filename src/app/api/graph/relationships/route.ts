import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { createRelationshipBodySchema } from "@/application/graph/graph-api";
import { jsonCreated, jsonError } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { ValidationError } from "@/domain/shared/errors";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`graph:rel:create:${session.user.id}`);
    const body: unknown = await request.json();
    const parsed = createRelationshipBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid relationship payload");
    }

    const source = await container.graph.getEntity(parsed.data.sourceEntityId);
    if (!source) throw new ValidationError("Source entity not found");
    if (
      source.linkedUserId !== session.user.id &&
      source.ownerUserId !== session.user.id
    ) {
      throw new ValidationError("Not allowed to create this relationship");
    }

    const relationship = await container.graph.createRelationship({
      sourceEntityId: parsed.data.sourceEntityId,
      targetEntityId: parsed.data.targetEntityId,
      relationshipType: parsed.data.relationshipType,
      confidenceScore: parsed.data.confidenceScore ?? 1,
      source: "USER",
      verified: true,
      verificationStatus: "USER_VERIFIED",
      evidence: parsed.data.evidence,
    });

    return jsonCreated({ relationship });
  } catch (error) {
    return jsonError(error);
  }
}
