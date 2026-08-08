import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const feedbackSchema = z.object({
  feedback: z.enum([
    "USEFUL",
    "NOT_USEFUL",
    "NOT_INTERESTED",
    "ALREADY_KNOW",
    "DISMISS",
  ]),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    getRateLimiter().consume(`rec:fb:${session.user.id}`);

    const body: unknown = await request.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError("Invalid feedback");

    await container.recommendations.recordFeedback({
      userId: session.user.id,
      recommendationId: decodedId,
      feedback: parsed.data.feedback,
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
