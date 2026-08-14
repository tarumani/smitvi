import { CHAT_MODEL, getOpenAIClient } from "@/infrastructure/ai/openai-client";
import { throwMappedAiError } from "@/infrastructure/ai/map-ai-error";
import {
  PROFILE_EXTRACTION_SYSTEM,
  PROJECT_EXTRACTION_SYSTEM,
} from "@/application/onboarding/profile-ai-prompts";
import {
  profileExtractionSchema,
  projectExtractionSchema,
  type ProfileExtraction,
  type ProjectExtraction,
} from "@/domain/profile/profile-extraction";
import type { ProfileTypeId } from "@/domain/profile/activation";

function parseJsonObject(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  return JSON.parse(trimmed);
}

async function completeJson(system: string, user: string): Promise<string> {
  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: CHAT_MODEL,
    input: [
      { role: "system", content: system },
      { role: "user", content: user.slice(0, 12_000) },
    ],
    text: { format: { type: "json_object" } },
  });
  return response.output_text;
}

function heuristicTypeMismatch(
  selected: ProfileTypeId,
  text: string,
): { mismatch: boolean; suggested: ProfileTypeId | null; reason: string | null } {
  const t = text.toLowerCase();
  const brandLike =
    /\b(brand|offers|apparel|footwear|we sell|our products|our company|we manufacture)\b/.test(
      t,
    );
  if (brandLike && selected !== "FOUNDER") {
    return {
      mismatch: true,
      suggested: "FOUNDER",
      reason: "It sounds like you may be creating a Business profile.",
    };
  }
  const teaching =
    /\b(i teach|courses|tutorials|students|curriculum|mentor)\b/.test(t);
  if (teaching && selected === "PROFESSIONAL") {
    return {
      mismatch: true,
      suggested: "EDUCATOR",
      reason: "It sounds like you may be creating an Educator profile.",
    };
  }
  return { mismatch: false, suggested: null, reason: null };
}

export async function extractProfileFromNarrative(input: {
  narrative: string;
  selectedType: ProfileTypeId;
}): Promise<ProfileExtraction> {
  const heuristic = heuristicTypeMismatch(input.selectedType, input.narrative);
  const user = `Selected profile type: ${input.selectedType}\n\nUser text:\n${input.narrative}`;

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await completeJson(PROFILE_EXTRACTION_SYSTEM, user);
      const parsed = profileExtractionSchema.parse(parseJsonObject(raw));
      if (!parsed.typeMismatch && heuristic.mismatch) {
        return {
          ...parsed,
          typeMismatch: true,
          suggestedProfileType: heuristic.suggested,
          suggestedTypeReason: heuristic.reason,
        };
      }
      return parsed;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error && /OPENAI_API_KEY/i.test(lastError.message)) {
    throwMappedAiError(lastError);
  }

  return {
    suggestedProfileType: heuristic.suggested,
    typeMismatch: heuristic.mismatch,
    suggestedTypeReason: heuristic.reason,
    suggestedHeadline: null,
    summary: null,
    roles: [],
    skills: [],
    expertiseAreas: [],
    industries: [],
    experienceYears: null,
    confidence: { skills: 0, industries: 0, experienceYears: 0 },
  };
}

export async function extractProjectFromNarrative(
  narrative: string,
): Promise<ProjectExtraction> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await completeJson(PROJECT_EXTRACTION_SYSTEM, narrative);
      return projectExtractionSchema.parse(parseJsonObject(raw));
    } catch (error) {
      lastError = error;
    }
  }
  throwMappedAiError(lastError);
}
