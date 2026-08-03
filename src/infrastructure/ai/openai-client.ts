import OpenAI from "openai";
import {
  CHAT_MODEL,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
} from "@/config/ai";
import { ValidationError } from "@/domain/shared/errors";
import { throwMappedAiError } from "@/infrastructure/ai/map-ai-error";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ValidationError(
      "OPENAI_API_KEY is required for embeddings and Twin chat. Add it on the server.",
    );
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  } catch (error) {
    throwMappedAiError(error);
  }
}

export async function generateKnowledgeMetadata(text: string): Promise<{
  summary: string;
  faqs: Array<{ question: string; answer: string }>;
  tags: string[];
  topics: string[];
}> {
  try {
    const openai = getOpenAIClient();
    const truncated = text.slice(0, 12_000);

    const response = await openai.responses.create({
      model: CHAT_MODEL,
      input: [
        {
          role: "system",
          content:
            "Extract structured knowledge metadata. Return strict JSON with keys summary (string), faqs (array of {question, answer} max 5), tags (string array max 10), topics (string array max 8). No markdown.",
        },
        {
          role: "user",
          content: truncated,
        },
      ],
      text: {
        format: { type: "json_object" },
      },
    });

    const raw = response.output_text;
    const parsed = JSON.parse(raw) as {
      summary?: string;
      faqs?: Array<{ question?: string; answer?: string }>;
      tags?: string[];
      topics?: string[];
    };

    return {
      summary: parsed.summary?.trim() || "No summary available.",
      faqs: (parsed.faqs ?? [])
        .filter((faq) => faq.question && faq.answer)
        .slice(0, 5)
        .map((faq) => ({
          question: faq.question!.trim(),
          answer: faq.answer!.trim(),
        })),
      tags: (parsed.tags ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 10),
      topics: (parsed.topics ?? [])
        .map((topic) => topic.trim())
        .filter(Boolean)
        .slice(0, 8),
    };
  } catch (error) {
    throwMappedAiError(error);
  }
}

export { CHAT_MODEL };
