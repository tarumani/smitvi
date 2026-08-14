import { prisma } from "@/infrastructure/database/prisma";
import { ValidationError } from "@/domain/shared/errors";
import {
  PROFILE_TYPE_TO_ARCHETYPE,
  type ProfileTypeId,
} from "@/domain/profile/activation";
import { classifyBioQuality, bioQualityPrompt } from "@/domain/profile/bio-quality";
import {
  toReviewable,
  uniqueByValue,
  type ProfileAiDraft,
} from "@/domain/profile/profile-extraction";
import { extractProfileFromNarrative } from "@/application/onboarding/profile-ai-extraction";
import {
  ensureOnboardingProfile,
  trackProfileEvent,
} from "@/application/onboarding/onboarding-helpers";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";

export class AnalyzeProfileNarrative {
  async execute(input: {
    userId: string;
    email: string;
    narrative: string;
    profileType: ProfileTypeId;
    linkedInUrl?: string | null;
    websiteUrl?: string | null;
    portfolioUrl?: string | null;
    keepExisting?: boolean;
  }) {
    const text = input.narrative.trim();
    if (text.length < 8) {
      throw new ValidationError(
        "Let's add a little more detail so people can understand what you know and what you do.",
      );
    }

    const quality = classifyBioQuality(text);
    if (quality === "LOW_QUALITY") {
      return {
        quality,
        prompt: bioQualityPrompt(quality),
        message:
          "Let's add a little more detail so people can understand what you know and what you do.",
        draft: null,
      };
    }

    await ensureOnboardingProfile(input.userId, input.email);
    await trackProfileEvent(input.userId, "PROFILE_AI_ANALYSIS_REQUESTED", {
      length: text.length,
    });

    const extraction = await extractProfileFromNarrative({
      narrative: text,
      selectedType: input.profileType,
    });

    const existing = input.keepExisting
      ? await prisma.profile.findUnique({
          where: { userId: input.userId },
          include: { skills: { include: { skill: true } } },
        })
      : null;

    const existingSkills =
      existing?.skills.map((s) => s.skill.name) ?? [];

    const draft: ProfileAiDraft = {
      narrative: text,
      linkedInUrl: input.linkedInUrl ?? null,
      websiteUrl: input.websiteUrl ?? null,
      portfolioUrl: input.portfolioUrl ?? null,
      profileType: input.profileType,
      suggestedType: extraction.suggestedProfileType,
      typeMismatch: extraction.typeMismatch,
      typeReason: extraction.suggestedTypeReason ?? null,
      headline: {
        value: extraction.suggestedHeadline,
        source: "AI_INFERRED",
        status: "PENDING_USER_REVIEW",
        confidence: extraction.confidence.skills,
        classification: "INFERRED",
      },
      summary: {
        value: extraction.summary,
        source: "AI_INFERRED",
        status: "PENDING_USER_REVIEW",
        classification: "INFERRED",
      },
      skills: uniqueByValue([
        ...existingSkills.map((name) => ({
          value: name,
          source: "USER" as const,
          status: "ACCEPTED" as const,
          classification: "EXPLICIT" as const,
          confidence: 1,
        })),
        ...extraction.skills.map(toReviewable),
      ]),
      expertiseAreas: uniqueByValue(extraction.expertiseAreas.map(toReviewable)),
      industries: uniqueByValue(extraction.industries.map(toReviewable)),
      roles: uniqueByValue(extraction.roles.map(toReviewable)),
      experienceYears: {
        value: extraction.experienceYears,
        source: "AI_INFERRED",
        status: "PENDING_USER_REVIEW",
        confidence: extraction.confidence.experienceYears,
      },
      step: "ai_review",
      version: (existing?.profileAIAnalysisVersion ?? 0) + 1,
    };

    await prisma.profile.update({
      where: { userId: input.userId },
      data: {
        profileType: input.profileType,
        hubArchetypeId: PROFILE_TYPE_TO_ARCHETYPE[input.profileType],
        onboardingDraft: draft as object,
        onboardingStep: "ai_review",
        profileAIAnalysisVersion: { increment: 1 },
        activationStatus: "PROFILE_DRAFTED",
        websiteUrl: input.websiteUrl || undefined,
      },
    });

    await trackProfileEvent(input.userId, "PROFILE_AI_ANALYSIS_COMPLETED", {
      skillCount: draft.skills.length,
      typeMismatch: Boolean(draft.typeMismatch),
    });

    await new ProfileActivationService().refresh(input.userId);

    return {
      quality,
      prompt: null,
      message: null,
      draft,
      extractionConfidence: extraction.confidence,
    };
  }
}
