import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { getEntitlements } from "@/domain/billing/entitlements";
import { ForbiddenError, ValidationError } from "@/domain/shared/errors";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import { jsonCreated, jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export async function GET() {
  try {
    const session = await requireSession();
    const keys = await container.apiKeys.listForUser(session.user.id);
    return jsonOk({ keys });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`api-keys:create:${session.user.id}`);

    const entitlements = getEntitlements(session.user.plan);
    if (!entitlements.publicApi) {
      throw new ForbiddenError(
        "API keys require a Pro or Business plan",
      );
    }

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid API key payload");
    }

    const created = await container.apiKeys.create({
      userId: session.user.id,
      name: parsed.data.name,
    });

    await new PrismaAuditLogRepository().create({
      actorId: session.user.id,
      action: "API_KEY_CREATED",
      entityType: "api_key",
      entityId: created.key.id,
      metadata: { name: created.key.name, prefix: created.key.keyPrefix },
    });

    return jsonCreated({
      key: created.key,
      rawKey: created.rawKey,
    });
  } catch (error) {
    return jsonError(error);
  }
}
