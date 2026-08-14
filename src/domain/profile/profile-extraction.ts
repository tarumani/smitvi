import { z } from "zod";
import { PROFILE_TYPES } from "@/domain/profile/activation";

export const extractedItemSchema = z.object({
  value: z.string().trim().min(1).max(160),
  evidence: z.string().trim().max(500).nullable().optional(),
  confidence: z.number().min(0).max(1),
  classification: z.enum(["EXPLICIT", "INFERRED"]),
});

export const profileExtractionSchema = z.object({
  suggestedProfileType: z.enum(PROFILE_TYPES).nullable(),
  typeMismatch: z.boolean().default(false),
  suggestedTypeReason: z.string().max(400).nullable().optional(),
  suggestedHeadline: z.string().trim().max(160).nullable(),
  summary: z.string().trim().max(500).nullable(),
  roles: z.array(extractedItemSchema).max(8).default([]),
  skills: z.array(extractedItemSchema).max(20).default([]),
  expertiseAreas: z.array(extractedItemSchema).max(12).default([]),
  industries: z.array(extractedItemSchema).max(12).default([]),
  experienceYears: z.number().min(0).max(60).nullable(),
  experienceYearsConfidence: z.number().min(0).max(1).nullable().optional(),
  confidence: z
    .object({
      skills: z.number().min(0).max(1).default(0),
      industries: z.number().min(0).max(1).default(0),
      experienceYears: z.number().min(0).max(1).default(0),
    })
    .default({ skills: 0, industries: 0, experienceYears: 0 }),
});

export type ExtractedItem = z.infer<typeof extractedItemSchema>;
export type ProfileExtraction = z.infer<typeof profileExtractionSchema>;

export const projectExtractionSchema = z.object({
  title: z.string().trim().min(1).max(160),
  role: z.string().trim().max(160).nullable(),
  description: z.string().trim().max(2000),
  skills: z.array(extractedItemSchema).max(16).default([]),
  industry: z.string().trim().max(80).nullable(),
  outcomes: z.string().trim().max(500).nullable(),
});

export type ProjectExtraction = z.infer<typeof projectExtractionSchema>;

export type ReviewableField<T> = {
  value: T;
  source: "AI_INFERRED" | "USER";
  status: "PENDING_USER_REVIEW" | "ACCEPTED" | "EDITED" | "REJECTED";
  evidence?: string | null;
  confidence?: number;
  classification?: "EXPLICIT" | "INFERRED";
};

export type ProfileAiDraft = {
  narrative: string;
  linkedInUrl?: string | null;
  websiteUrl?: string | null;
  portfolioUrl?: string | null;
  profileType: string;
  suggestedType?: string | null;
  typeMismatch?: boolean;
  typeReason?: string | null;
  headline: ReviewableField<string | null>;
  summary: ReviewableField<string | null>;
  skills: ReviewableField<string>[];
  expertiseAreas: ReviewableField<string>[];
  industries: ReviewableField<string>[];
  roles: ReviewableField<string>[];
  experienceYears: ReviewableField<number | null>;
  step?: string;
  version?: number;
};

export function toReviewable(
  item: ExtractedItem,
): ReviewableField<string> {
  return {
    value: item.value,
    source: "AI_INFERRED",
    status: "PENDING_USER_REVIEW",
    evidence: item.evidence ?? null,
    confidence: item.confidence,
    classification: item.classification,
  };
}

export function uniqueByValue(
  items: ReviewableField<string>[],
): ReviewableField<string>[] {
  const seen = new Set<string>();
  const out: ReviewableField<string>[] = [];
  for (const item of items) {
    const key = item.value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function acceptedValues(
  items: ReviewableField<string>[],
): string[] {
  return items
    .filter((i) => i.status === "ACCEPTED" || i.status === "EDITED")
    .map((i) => i.value.trim())
    .filter(Boolean);
}
