import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { getEntitlements } from "@/domain/billing/entitlements";
import { ForbiddenError, ValidationError } from "@/domain/shared/errors";
import {
  synthesizeSpeech,
  transcribeAudio,
} from "@/infrastructure/ai/voice";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import { jsonError } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`voice:ask:${session.user.id}`);

    const entitlements = getEntitlements(session.user.plan);
    if (!entitlements.voiceTwin) {
      throw new ForbiddenError(
        "Voice Twin requires a Pro or Business plan",
      );
    }

    const form = await request.formData();
    const file = form.get("audio");
    const conversationIdValue = form.get("conversationId");
    const organizationIdValue = form.get("organizationId");

    if (!(file instanceof File)) {
      throw new ValidationError("audio file is required");
    }

    const conversationId =
      typeof conversationIdValue === "string" && conversationIdValue.length > 0
        ? conversationIdValue
        : null;
    const organizationId =
      typeof organizationIdValue === "string" && organizationIdValue.length > 0
        ? organizationIdValue
        : null;

    if (organizationId) {
      await container.organizations.requireMembership(
        organizationId,
        session.user.id,
      );
    }

    const started = Date.now();
    const bytes = Buffer.from(await file.arrayBuffer());
    const transcript = await transcribeAudio({
      bytes,
      fileName: file.name || "voice.webm",
      mimeType: file.type || null,
    });

    const prepared = await container.askTwin.prepare({
      userId: session.user.id,
      plan: session.user.plan,
      ownerUserId: session.user.id,
      conversationId,
      question: transcript,
      publicOnly: false,
      organizationId,
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
    });

    const audio = await synthesizeSpeech(answered.answer);
    const durationMs = Date.now() - started;

    await prisma.voiceSession.create({
      data: {
        userId: session.user.id,
        conversationId: prepared.conversationId,
        transcript,
        answer: answered.answer,
        confidence: answered.confidence,
        durationMs,
      },
    });

    await new PrismaAuditLogRepository().create({
      actorId: session.user.id,
      action: "VOICE_TWIN_USED",
      entityType: "conversation",
      entityId: prepared.conversationId,
      metadata: { durationMs, confidence: answered.confidence },
    });

    return new Response(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Smitvi-Transcript": encodeURIComponent(transcript),
        "X-Smitvi-Answer": encodeURIComponent(answered.answer.slice(0, 1800)),
        "X-Smitvi-Conversation-Id": prepared.conversationId,
        "X-Smitvi-Confidence": String(answered.confidence),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
