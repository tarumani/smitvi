import { z } from "zod";

export const intelligenceItemSchema = z.object({
  value: z.string().trim().min(1).max(160),
  category: z.enum([
    "skill",
    "project",
    "experience",
    "achievement",
    "knowledge",
    "topic",
    "industry",
    "expertise",
  ]),
  confidence: z.number().min(0).max(1),
  evidence: z.string().max(400).nullable(),
  classification: z.enum(["EXPLICIT", "INFERRED"]),
});

export const intelligenceUpdateExtractionSchema = z.object({
  items: z.array(intelligenceItemSchema).max(24).default([]),
  projectTitle: z.string().max(160).nullable().optional(),
  projectDescription: z.string().max(2000).nullable().optional(),
  summary: z.string().max(500).nullable().optional(),
});

export type IntelligenceUpdateItem = z.infer<typeof intelligenceItemSchema>;
export type IntelligenceUpdateExtraction = z.infer<
  typeof intelligenceUpdateExtractionSchema
>;

export const INTELLIGENCE_UPDATE_SYSTEM = `You are an intelligence update extraction engine.

Extract only information supported by the user's input.

Do not invent:
- Skills
- Projects
- Employers
- Experience
- Achievements
- Credentials

Separate EXPLICIT facts from INFERRED suggestions.

Every item must include:
value, category, confidence, evidence, classification

classification: EXPLICIT or INFERRED

All inferred information must require explicit user confirmation.

Return schema-valid JSON:
{
  "items": [{"value":"...","category":"skill|project|experience|achievement|knowledge|topic|industry|expertise","confidence":0.0,"evidence":"...","classification":"EXPLICIT|INFERRED"}],
  "projectTitle": string|null,
  "projectDescription": string|null,
  "summary": string|null
}`;
