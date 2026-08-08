import { LOW_CONFIDENCE_REPLY } from "@/config/ai";
import { INSUFFICIENT_EVIDENCE_REPLY } from "@/config/twin-ai";
import { hasUnlimitedAi } from "@/config/billing";
import { FREE_AI_CHATS_PER_DAY } from "@/config/constants";
import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "@/domain/shared/errors";
import type { TwinPreparedIntelligence } from "@/domain/twin/types";
import {
  CHAT_MODEL,
  getOpenAIClient,
} from "@/infrastructure/ai/openai-client";
import type { PrismaKnowledgeRepository } from "@/infrastructure/database/repositories/knowledge-repository";
import type { PrismaConversationRepository } from "@/infrastructure/database/repositories/conversation-repository";
import type { UserPlan } from "@/domain/user/entities";
import type { TwinIntelligenceEngine } from "@/application/twin/twin-intelligence-engine";

export type TwinCitation = {
  sourceId: string;
  sourceTitle: string;
  chunkId: string;
  excerpt: string;
  score: number;
};

export type TwinChatMeta = {
  confidenceLevel?: TwinPreparedIntelligence["confidenceLevel"];
  claimLevel?: TwinPreparedIntelligence["claimLevel"];
  relatedQuestions?: string[];
  suggestedActions?: string[];
  contradictions?: TwinPreparedIntelligence["contradictions"];
};

export class AskTwin {
  constructor(
    private readonly knowledge: PrismaKnowledgeRepository,
    private readonly conversations: PrismaConversationRepository,
    private readonly intelligence: TwinIntelligenceEngine,
  ) {}

  async prepare(input: {
    userId: string | null | undefined;
    plan: UserPlan;
    ownerUserId: string;
    conversationId?: string | null;
    question: string;
    publicOnly?: boolean;
    organizationId?: string | null;
    responseMode?: "factual" | "representative";
  }) {
    if (!input.userId) {
      throw new UnauthorizedError();
    }

    const question = input.question.trim();
    if (question.length < 2) {
      throw new ValidationError("Question is too short");
    }

    if (!hasUnlimitedAi(input.plan)) {
      const used = await this.conversations.getDailyUsage(input.userId);
      if (used >= FREE_AI_CHATS_PER_DAY) {
        throw new ForbiddenError(
          `Free plan limit reached (${FREE_AI_CHATS_PER_DAY} chats/day). Upgrade to Pro for unlimited AI.`,
        );
      }
    }

    const organizationId = input.organizationId ?? null;
    const publicOnly = organizationId
      ? false
      : (input.publicOnly ?? input.ownerUserId !== input.userId);

    const readyCount = await this.knowledge.countReadySources(
      input.ownerUserId,
      { publicOnly, organizationId },
    );
    if (readyCount === 0) {
      if (organizationId) {
        throw new ValidationError(
          "This workspace has no ready knowledge sources yet.",
        );
      }
      if (publicOnly) {
        throw new ValidationError(
          "This Twin has no public knowledge sources yet.",
        );
      }
    }

    let conversationId = input.conversationId ?? null;
    if (conversationId) {
      const existing = await this.conversations.getForUser(
        conversationId,
        input.userId,
      );
      if (!existing) {
        throw new ValidationError("Conversation not found");
      }
      if (
        organizationId &&
        existing.organizationId &&
        existing.organizationId !== organizationId
      ) {
        throw new ValidationError("Conversation belongs to another workspace");
      }
    } else {
      const created = await this.conversations.create({
        userId: input.userId,
        ownerUserId: input.ownerUserId,
        organizationId,
        visibility: publicOnly ? "PUBLIC" : "PRIVATE",
      });
      conversationId = created.id;
    }

    await this.conversations.addMessage({
      conversationId,
      role: "USER",
      content: question,
    });

    const intel = await this.intelligence.prepare({
      ownerUserId: input.ownerUserId,
      viewerUserId: input.userId,
      question,
      conversationId,
      publicOnly,
      organizationId,
      responseMode: input.responseMode,
    });

    if (readyCount === 0 && intel.contextBlocks.length === 0) {
      throw new ValidationError(
        "No ready knowledge sources yet. Upload documents or build your intelligence graph before chatting with your Twin.",
      );
    }

    return {
      conversationId,
      confidence: intel.confidence,
      citations: intel.citations,
      retrieved: intel.retrieved,
      question,
      canAnswer: intel.canAnswer,
      contextBlocks: intel.contextBlocks,
      systemPrompt: intel.systemPrompt,
      twinMeta: {
        confidenceLevel: intel.confidenceLevel,
        claimLevel: intel.claimLevel,
        relatedQuestions: intel.relatedQuestions,
        suggestedActions: intel.suggestedActions,
        contradictions: intel.contradictions,
        extendedCitations: intel.extendedCitations,
        understanding: intel.understanding,
        plan: intel.plan,
      } satisfies TwinChatMeta & {
        extendedCitations: TwinPreparedIntelligence["extendedCitations"];
        understanding: TwinPreparedIntelligence["understanding"];
        plan: TwinPreparedIntelligence["plan"];
      },
      deterministicFallback: intel.deterministicFallback,
      insufficientReply: intel.insufficientReply ?? INSUFFICIENT_EVIDENCE_REPLY,
      useLlm: intel.plan.useLlm,
    };
  }

  async answerOnce(input: {
    userId: string;
    conversationId: string;
    question: string;
    confidence: number;
    citations: TwinCitation[];
    contextBlocks: string[];
    canAnswer: boolean;
    systemPrompt?: string;
    deterministicFallback?: string | null;
    insufficientReply?: string;
    useLlm?: boolean;
    twinMeta?: TwinChatMeta;
  }): Promise<{ answer: string; confidence: number; citations: TwinCitation[] }> {
    const lowReply = input.insufficientReply ?? LOW_CONFIDENCE_REPLY;

    if (input.deterministicFallback && input.useLlm === false) {
      await this.persistAssistant(input, input.deterministicFallback);
      return {
        answer: input.deterministicFallback,
        confidence: input.confidence,
        citations: input.citations,
      };
    }

    if (!input.canAnswer) {
      await this.persistAssistant(input, lowReply);
      return {
        answer: lowReply,
        confidence: input.confidence,
        citations: input.citations,
      };
    }

    const openai = getOpenAIClient();
    const context = input.contextBlocks.join("\n\n---\n\n");
    const response = await openai.responses.create({
      model: CHAT_MODEL,
      input: [
        {
          role: "system",
          content: input.systemPrompt ?? defaultPrompt(),
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${input.question}`,
        },
      ],
    });

    const answer = response.output_text.trim() || lowReply;
    await this.persistAssistant(input, answer);
    return {
      answer,
      confidence: input.confidence,
      citations: input.citations,
    };
  }

  async streamAnswer(input: {
    userId: string;
    conversationId: string;
    question: string;
    confidence: number;
    citations: TwinCitation[];
    contextBlocks: string[];
    canAnswer: boolean;
    systemPrompt?: string;
    deterministicFallback?: string | null;
    insufficientReply?: string;
    useLlm?: boolean;
    twinMeta?: TwinChatMeta;
  }): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder();
    const lowReply = input.insufficientReply ?? LOW_CONFIDENCE_REPLY;
    const metaPayload = {
      type: "meta" as const,
      conversationId: input.conversationId,
      confidence: input.confidence,
      citations: input.citations,
      twinMeta: input.twinMeta,
    };

    if (input.deterministicFallback && input.useLlm === false) {
      return this.staticStream(
        encoder,
        metaPayload,
        input,
        input.deterministicFallback,
      );
    }

    if (!input.canAnswer) {
      return this.staticStream(encoder, metaPayload, input, lowReply);
    }

    const openai = getOpenAIClient();
    const context = input.contextBlocks.join("\n\n---\n\n");

    const stream = await openai.responses.create({
      model: CHAT_MODEL,
      stream: true,
      input: [
        {
          role: "system",
          content: input.systemPrompt ?? defaultPrompt(),
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${input.question}`,
        },
      ],
    });

    const conversations = this.conversations;
    let full = "";

    return new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`${JSON.stringify(metaPayload)}\n`),
        );

        try {
          for await (const event of stream) {
            if (
              event.type === "response.output_text.delta" &&
              "delta" in event &&
              typeof event.delta === "string"
            ) {
              full += event.delta;
              controller.enqueue(
                encoder.encode(
                  `${JSON.stringify({
                    type: "token",
                    content: event.delta,
                  })}\n`,
                ),
              );
            }
          }

          const answer = full.trim() || lowReply;
          await conversations.addMessage({
            conversationId: input.conversationId,
            role: "ASSISTANT",
            content: answer,
            confidence: input.confidence,
            citations: input.citations,
          });
          await conversations.incrementDailyUsage(input.userId);

          controller.enqueue(
            encoder.encode(`${JSON.stringify({ type: "done" })}\n`),
          );
          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({
                type: "error",
                message:
                  error instanceof Error ? error.message : "Stream failed",
              })}\n`,
            ),
          );
          controller.close();
        }
      },
    });
  }

  private async persistAssistant(
    input: {
      userId: string;
      conversationId: string;
      confidence: number;
      citations: TwinCitation[];
    },
    content: string,
  ) {
    await this.conversations.addMessage({
      conversationId: input.conversationId,
      role: "ASSISTANT",
      content,
      confidence: input.confidence,
      citations: input.citations,
    });
    await this.conversations.incrementDailyUsage(input.userId);
  }

  private staticStream(
    encoder: TextEncoder,
    metaPayload: object,
    input: {
      userId: string;
      conversationId: string;
      confidence: number;
      citations: TwinCitation[];
    },
    text: string,
  ) {
    return new ReadableStream({
      start: async (controller) => {
        controller.enqueue(
          encoder.encode(`${JSON.stringify(metaPayload)}\n`),
        );
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: "token", content: text })}\n`,
          ),
        );
        await this.persistAssistant(input, text);
        controller.enqueue(
          encoder.encode(`${JSON.stringify({ type: "done" })}\n`),
        );
        controller.close();
      },
    });
  }
}

function defaultPrompt() {
  return "You are a Knowledge Twin. Answer using the provided context only.";
}

// Re-export for config module split
export { LOW_CONFIDENCE_REPLY } from "@/config/ai";
