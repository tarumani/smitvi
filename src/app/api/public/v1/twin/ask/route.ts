import { z } from "zod";
import { requireApiKey } from "@/application/api/require-api-key";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import {
  publicApiOptionsResponse,
  withPublicApiCors,
} from "@/infrastructure/http/cors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const bodySchema = z.object({
  question: z.string().trim().min(2).max(4000),
  conversationId: z.string().uuid().optional().nullable(),
});

export async function OPTIONS() {
  return publicApiOptionsResponse();
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiKey(request, "twin:ask");
    getRateLimiter().consume(`public-api:ask:${auth.userId}`);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid ask payload");
    }

    const prepared = await container.askTwin.prepare({
      userId: auth.userId,
      plan: auth.plan,
      ownerUserId: auth.userId,
      conversationId: parsed.data.conversationId,
      question: parsed.data.question,
      publicOnly: false,
    });

    const answered = await container.askTwin.answerOnce({
      userId: auth.userId,
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
    });

    return withPublicApiCors(
      jsonOk({
        conversationId: prepared.conversationId,
        answer: answered.answer,
        confidence: answered.confidence,
        citations: answered.citations,
      }),
    );
  } catch (error) {
    return withPublicApiCors(jsonError(error));
  }
}
