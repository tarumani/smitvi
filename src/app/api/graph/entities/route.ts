import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import {
  createEntityBodySchema,
  mapEntityType,
} from "@/application/graph/graph-api";
import { jsonCreated, jsonError } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { ValidationError } from "@/domain/shared/errors";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`graph:entity:create:${session.user.id}`);
    const body: unknown = await request.json();
    const parsed = createEntityBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid entity payload");
    }

    const ownerUserId = parsed.data.ownerUserId ?? session.user.id;
    if (ownerUserId !== session.user.id) {
      throw new ValidationError("Cannot create entities for another user");
    }

    const entity = await container.graph.createEntity({
      entityType: mapEntityType(parsed.data.entityType),
      name: parsed.data.name,
      description: parsed.data.description,
      ownerUserId,
      visibility: parsed.data.visibility,
      aliasSource: "USER",
    });

    return jsonCreated({ entity });
  } catch (error) {
    return jsonError(error);
  }
}
