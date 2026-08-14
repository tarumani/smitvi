import { CHAT_MODEL, getOpenAIClient } from "@/infrastructure/ai/openai-client";
import { throwMappedAiError } from "@/infrastructure/ai/map-ai-error";
import { ValidationError } from "@/domain/shared/errors";
import {
  INTELLIGENCE_UPDATE_SYSTEM,
  intelligenceUpdateExtractionSchema,
  type IntelligenceUpdateExtraction,
} from "@/domain/intelligence/update-extraction";

export async function extractIntelligenceUpdate(
  narrative: string,
): Promise<IntelligenceUpdateExtraction> {
  const text = narrative.trim();
  if (text.length < 12) {
    throw new ValidationError(
      "Tell us a little more about what you worked on or learned.",
    );
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.responses.create({
      model: CHAT_MODEL,
      input: [
        { role: "system", content: INTELLIGENCE_UPDATE_SYSTEM },
        { role: "user", content: text.slice(0, 8000) },
      ],
      text: { format: { type: "json_object" } },
    });
    return intelligenceUpdateExtractionSchema.parse(
      JSON.parse(response.output_text),
    );
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    try {
      throwMappedAiError(error);
    } catch {
      return {
        items: [],
        projectTitle: null,
        projectDescription: null,
        summary: null,
      };
    }
  }
}
