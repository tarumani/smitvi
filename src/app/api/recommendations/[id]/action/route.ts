import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const actionSchema = z.object({
  action: z.string().min(1).max(32),
  score: z.number().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    getRateLimiter().consume(`rec:act:${session.user.id}`);

    const body: unknown = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError("Invalid action");

    await container.recommendations.recordAction({
      userId: session.user.id,
      recommendationId: decodedId,
      action: parsed.data.action,
      score: parsed.data.score,
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
