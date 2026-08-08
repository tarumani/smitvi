import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ForbiddenError, ValidationError } from "@/domain/shared/errors";
import { jsonError } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const bodySchema = z.object({
  question: z.string().trim().min(2).max(4000),
  conversationId: z.string().uuid().optional().nullable(),
  ownerUserId: z.string().uuid().optional().nullable(),
  organizationId: z.string().uuid().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`chat:${session.user.id}`);

    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError("Invalid chat request");
    }

    const organizationId = parsed.data.organizationId ?? null;
    if (organizationId) {
      await container.organizations.requireMembership(
        organizationId,
        session.user.id,
      );
    }

    const ownerUserId = parsed.data.ownerUserId ?? session.user.id;
    const isPublicTwin = !organizationId && ownerUserId !== session.user.id;

    if (isPublicTwin) {
      const ownerProfile =
        await container.profiles.findSummaryByUserId(ownerUserId);
      if (
        !ownerProfile ||
        ownerProfile.visibility === "PRIVATE" ||
        !ownerProfile.publicTwinEnabled
      ) {
        throw new ForbiddenError("This Knowledge Twin is not publicly available");
      }
    }

    const prepared = await container.askTwin.prepare({
      userId: session.user.id,
      plan: session.user.plan,
      ownerUserId,
      conversationId: parsed.data.conversationId,
      question: parsed.data.question,
      publicOnly: isPublicTwin,
      organizationId,
    });

    const stream = await container.askTwin.streamAnswer({
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

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
