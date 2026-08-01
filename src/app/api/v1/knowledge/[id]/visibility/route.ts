import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  isPublic: z.boolean(),
});

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    getRateLimiter().consume(`knowledge:visibility:${session.user.id}`);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid visibility payload");
    }

    const source = await container.knowledge.setPublic(
      id,
      session.user.id,
      parsed.data.isPublic,
    );
    if (!source) throw new NotFoundError("Knowledge source not found");

    return jsonOk({ source });
  } catch (error) {
    return jsonError(error);
  }
}
