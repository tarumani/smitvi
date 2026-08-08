import { CHAT_MODEL } from "@/config/ai";
import { getOpenAIClient } from "@/infrastructure/ai/openai-client";
import { throwMappedAiError } from "@/infrastructure/ai/map-ai-error";

export type GraphExtractionResult = {
  entities: Array<{ type: string; name: string; confidence: number }>;
  relationships: Array<{
    index: number;
    type: string;
    sourceType: string;
    sourceName: string;
    targetType: string;
    targetName: string;
    confidence: number;
  }>;
  evidence: Array<{ relationshipIndex: number; excerpt?: string; page?: number }>;
};

export async function generateGraphExtractionFromText(
  text: string,
): Promise<GraphExtractionResult> {
  try {
    const openai = getOpenAIClient();
    const truncated = text.slice(0, 14_000);

    const response = await openai.responses.create({
      model: CHAT_MODEL,
      input: [
        {
          role: "system",
          content: `Extract entities and relationships for a professional knowledge graph. Return strict JSON:
{
  "entities": [{"type":"SKILL|TOPIC|TECHNOLOGY|TOOL|INDUSTRY|COMPANY|PROJECT|PROFESSION","name":"...","confidence":0.0-1.0}],
  "relationships": [{"index":0,"type":"USER_HAS_SKILL|USER_USES_TECHNOLOGY|USER_USES_TOOL|USER_WORKS_IN_INDUSTRY|USER_HAS_EXPERTISE|PROJECT_HAS_SKILL|PROJECT_USES_TECHNOLOGY","sourceType":"USER|SKILL|...","sourceName":"...","targetType":"...","targetName":"...","confidence":0.0-1.0}],
  "evidence": [{"relationshipIndex":0,"excerpt":"short quote"}]
}
Only use allowed relationship types. Prefer USER_* edges from the document author to skills/tools/technologies. No markdown.`,
        },
        { role: "user", content: truncated },
      ],
      text: { format: { type: "json_object" } },
    });

    const parsed = JSON.parse(response.output_text) as GraphExtractionResult;
    return {
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      relationships: Array.isArray(parsed.relationships)
        ? parsed.relationships.map((r, i) => ({ ...r, index: r.index ?? i }))
        : [],
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
    };
  } catch (error) {
    throwMappedAiError(error);
  }
}
