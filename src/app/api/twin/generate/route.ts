import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const schema = z.object({
  kind: z.enum([
    "bio",
    "about",
    "portfolio_summary",
    "project_description",
    "case_study",
    "linkedin_post",
    "email",
    "resume_bullet",
  ]),
  topic: z.string().max(200).optional(),
  responseMode: z.enum(["factual", "representative"]).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`twin:gen:${session.user.id}`);

    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ValidationError("Invalid generate request");

    const question = `Generate ${parsed.data.kind.replace(/_/g, " ")}${parsed.data.topic ? ` about ${parsed.data.topic}` : ""} using only verified knowledge.`;

    const prepared = await container.askTwin.prepare({
      userId: session.user.id,
      plan: session.user.plan,
      ownerUserId: session.user.id,
      question,
      responseMode: parsed.data.responseMode ?? "factual",
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
      insufficientReply: prepared.insufficientReply,
      useLlm: prepared.useLlm,
    });

    return jsonOk({
      content: answered.answer,
      confidence: answered.confidence,
      citations: answered.citations,
    });
  } catch (error) {
    return jsonError(error);
  }
}
