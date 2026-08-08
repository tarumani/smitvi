import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

const schema = z.object({
  feedback: z.enum([
    "HELPFUL",
    "NOT_HELPFUL",
    "CORRECT",
    "INCORRECT",
    "MISSING",
    "HALLUCINATION",
  ]),
  conversationId: z.string().uuid().optional().nullable(),
  messageId: z.string().uuid().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ValidationError("Invalid feedback");

    await container.twinAnalytics.recordFeedback({
      userId: session.user.id,
      conversationId: parsed.data.conversationId,
      messageId: parsed.data.messageId,
      feedback: parsed.data.feedback,
      note: parsed.data.note,
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
