import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const bodySchema = z.object({
  question: z.string().trim().min(2).max(4000),
  conversationId: z.string().uuid().optional().nullable(),
  ownerUserId: z.string().uuid().optional().nullable(),
  responseMode: z.enum(["factual", "representative"]).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`twin:query:${session.user.id}`);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) throw new ValidationError("Invalid query");

    const ownerUserId = parsed.data.ownerUserId ?? session.user.id;
    const prepared = await container.askTwin.prepare({
      userId: session.user.id,
      plan: session.user.plan,
      ownerUserId,
      conversationId: parsed.data.conversationId,
      question: parsed.data.question,
      publicOnly: ownerUserId !== session.user.id,
      responseMode: parsed.data.responseMode,
    });

    const answered = await container.askTwin.answerOnce({
      userId: session.user.id,
      conversationId: prepared.conversationId,
      question: prepared.question,
      confidence: prepared.confidence,
      citations: prepared.citations,
      contextBlocks: prepared.contextBlocks,
      canAnswer: prepared.canAnswer,
      systemPrompt: prepared.systemPrompt,
      deterministicFallback: prepared.deterministicFallback,
      insufficientReply: prepared.insufficientReply,
      useLlm: prepared.useLlm,
      twinMeta: prepared.twinMeta,
    });

    return jsonOk({
      conversationId: prepared.conversationId,
      answer: answered.answer,
      confidence: answered.confidence,
      citations: answered.citations,
      twinMeta: prepared.twinMeta,
    });
  } catch (error) {
    return jsonError(error);
  }
}
