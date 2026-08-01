import {
  ANSWER_MIN_CONFIDENCE,
  LOW_CONFIDENCE_REPLY,
  RETRIEVAL_MIN_SCORE,
  RETRIEVAL_TOP_K,
} from "@/config/ai";
import { hasUnlimitedAi } from "@/config/billing";
import { FREE_AI_CHATS_PER_DAY } from "@/config/constants";
import { averageScore } from "@/domain/knowledge/similarity";
import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "@/domain/shared/errors";
import {
  CHAT_MODEL,
  embedTexts,
  getOpenAIClient,
} from "@/infrastructure/ai/openai-client";
import type { PrismaKnowledgeRepository } from "@/infrastructure/database/repositories/knowledge-repository";
import type { PrismaConversationRepository } from "@/infrastructure/database/repositories/conversation-repository";
import type { UserPlan } from "@/domain/user/entities";

export type TwinCitation = {
  sourceId: string;
  sourceTitle: string;
  chunkId: string;
  excerpt: string;
  score: number;
};

export class AskTwin {
  constructor(
    private readonly knowledge: PrismaKnowledgeRepository,
    private readonly conversations: PrismaConversationRepository,
  ) {}

  async prepare(input: {
    userId: string | null | undefined;
    plan: UserPlan;
    ownerUserId: string;
    conversationId?: string | null;
    question: string;
    /** When chatting with someone else's Twin, only public knowledge is used. */
    publicOnly?: boolean;
    /** Company workspace Twin — retrieves org knowledge instead of personal. */
    organizationId?: string | null;
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
      throw new ValidationError(
        organizationId
          ? "This workspace has no ready knowledge sources yet."
          : publicOnly
            ? "This Twin has no public knowledge sources yet."
            : "No ready knowledge sources yet. Upload documents before chatting with your Twin.",
      );
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

    const [queryEmbedding] = await embedTexts([question]);
    const retrieved = await this.knowledge.searchSimilar({
      ownerUserId: input.ownerUserId,
      queryEmbedding: queryEmbedding ?? [],
      topK: RETRIEVAL_TOP_K,
      minScore: RETRIEVAL_MIN_SCORE,
      publicOnly,
      organizationId,
    });

    const confidence = averageScore(retrieved.map((item) => item.score));
    const citations: TwinCitation[] = retrieved.map((item) => ({
      sourceId: item.sourceId,
      sourceTitle: item.sourceTitle,
      chunkId: item.id,
      excerpt: item.content.slice(0, 220),
      score: Number(item.score.toFixed(4)),
    }));

    return {
      conversationId,
      confidence,
      citations,
      retrieved,
      question,
      canAnswer: retrieved.length > 0 && confidence >= ANSWER_MIN_CONFIDENCE,
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
  }): Promise<{ answer: string; confidence: number; citations: TwinCitation[] }> {
    if (!input.canAnswer) {
      await this.conversations.addMessage({
        conversationId: input.conversationId,
        role: "ASSISTANT",
        content: LOW_CONFIDENCE_REPLY,
        confidence: input.confidence,
        citations: input.citations,
      });
      await this.conversations.incrementDailyUsage(input.userId);
      return {
        answer: LOW_CONFIDENCE_REPLY,
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
          content:
            "You are a Knowledge Twin. Answer ONLY using the provided context. If the context is insufficient, reply exactly: I don't know. Cite sources inline as [1], [2] matching context order. Never invent facts.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${input.question}`,
        },
      ],
    });

    const answer = response.output_text.trim() || LOW_CONFIDENCE_REPLY;
    await this.conversations.addMessage({
      conversationId: input.conversationId,
      role: "ASSISTANT",
      content: answer,
      confidence: input.confidence,
      citations: input.citations,
    });
    await this.conversations.incrementDailyUsage(input.userId);

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
  }): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder();

    if (!input.canAnswer) {
      await this.conversations.addMessage({
        conversationId: input.conversationId,
        role: "ASSISTANT",
        content: LOW_CONFIDENCE_REPLY,
        confidence: input.confidence,
        citations: input.citations,
      });
      await this.conversations.incrementDailyUsage(input.userId);

      return new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({
                type: "meta",
                conversationId: input.conversationId,
                confidence: input.confidence,
                citations: input.citations,
              })}\n`,
            ),
          );
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({
                type: "token",
                content: LOW_CONFIDENCE_REPLY,
              })}\n`,
            ),
          );
          controller.enqueue(
            encoder.encode(`${JSON.stringify({ type: "done" })}\n`),
          );
          controller.close();
        },
      });
    }

    const openai = getOpenAIClient();
    const context = input.contextBlocks.join("\n\n---\n\n");

    const stream = await openai.responses.create({
      model: CHAT_MODEL,
      stream: true,
      input: [
        {
          role: "system",
          content:
            "You are a Knowledge Twin. Answer ONLY using the provided context. If the context is insufficient, reply exactly: I don't know. Cite sources inline as [1], [2] matching context order. Never invent facts.",
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
          encoder.encode(
            `${JSON.stringify({
              type: "meta",
              conversationId: input.conversationId,
              confidence: input.confidence,
              citations: input.citations,
            })}\n`,
          ),
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

          const answer = full.trim() || LOW_CONFIDENCE_REPLY;
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
}
