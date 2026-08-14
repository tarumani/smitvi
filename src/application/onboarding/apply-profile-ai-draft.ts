import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { PROFILE_TYPES } from "@/domain/profile/activation";
import type { ProfileType } from "@/generated/prisma/client";
import {
  acceptedValues,
  type ProfileAiDraft,
  type ReviewableField,
} from "@/domain/profile/profile-extraction";
import { trackProfileEvent } from "@/application/onboarding/onboarding-helpers";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";

const fieldSchema = z.object({
  value: z.union([z.string(), z.number(), z.null()]),
  source: z.enum(["AI_INFERRED", "USER"]),
  status: z.enum(["PENDING_USER_REVIEW", "ACCEPTED", "EDITED", "REJECTED"]),
  evidence: z.string().nullable().optional(),
  confidence: z.number().optional(),
  classification: z.enum(["EXPLICIT", "INFERRED"]).optional(),
});

const draftSchema = z.object({
  narrative: z.string(),
  linkedInUrl: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  portfolioUrl: z.string().nullable().optional(),
  profileType: z.enum(PROFILE_TYPES),
  suggestedType: z.string().nullable().optional(),
  typeMismatch: z.boolean().optional(),
  typeReason: z.string().nullable().optional(),
  headline: fieldSchema,
  summary: fieldSchema,
  skills: z.array(fieldSchema),
  expertiseAreas: z.array(fieldSchema),
  industries: z.array(fieldSchema),
  roles: z.array(fieldSchema),
  experienceYears: fieldSchema,
  step: z.string().optional(),
  version: z.number().optional(),
});

function acceptPendingFields(draft: ProfileAiDraft): ProfileAiDraft {
  const bump = <T,>(field: ReviewableField<T>): ReviewableField<T> =>
    field.status === "PENDING_USER_REVIEW" && field.value != null
      ? { ...field, status: "ACCEPTED" }
      : field;
  const bumpList = (items: ReviewableField<string>[]) =>
    items.map((item) =>
      item.status === "PENDING_USER_REVIEW" ? { ...item, status: "ACCEPTED" as const } : item,
    );
  return {
    ...draft,
    headline: bump(draft.headline),
    summary: bump(draft.summary),
    experienceYears: bump(draft.experienceYears),
    skills: bumpList(draft.skills),
    expertiseAreas: bumpList(draft.expertiseAreas),
    industries: bumpList(draft.industries),
    roles: bumpList(draft.roles),
  };
}

function stringFields(items: ReviewableField<unknown>[]): ReviewableField<string>[] {
  return items.filter(
    (i): i is ReviewableField<string> => typeof i.value === "string",
  );
}

export class ApplyProfileAiDraft {
  async execute(userId: string, raw: unknown) {
    const envelope = z.object({
      draft: draftSchema.optional(),
      acceptPending: z.boolean().optional(),
    });
    const wrapped = envelope.safeParse(raw);
    const rawDraft =
      wrapped.success && wrapped.data.draft ? wrapped.data.draft : raw;
    const acceptPending =
      wrapped.success && wrapped.data.acceptPending === false ? false : true;
    const parsed = draftSchema.safeParse(rawDraft);
    if (!parsed.success) {
      throw new ValidationError("Invalid profile draft");
    }
    let draft = parsed.data as unknown as ProfileAiDraft;
    if (acceptPending) {
      draft = acceptPendingFields(draft);
    }

    const acceptedSkills = acceptedValues(stringFields(draft.skills));
    const rejected = stringFields(draft.skills).filter(
      (s) => s.status === "REJECTED",
    ).length;
    const accepted = stringFields(draft.skills).filter(
      (s) => s.status === "ACCEPTED" || s.status === "EDITED",
    ).length;

    const headline =
      draft.headline.status === "REJECTED"
        ? null
        : draft.headline.status === "PENDING_USER_REVIEW"
          ? null
          : (draft.headline.value as string | null);
    const summary =
      draft.summary.status === "REJECTED" ||
      draft.summary.status === "PENDING_USER_REVIEW"
        ? null
        : (draft.summary.value as string | null);

    const expertise = acceptedValues(stringFields(draft.expertiseAreas));
    const industries = acceptedValues(stringFields(draft.industries));

    const socialLinks: Array<{ platform: "linkedin" | "website"; url: string }> =
      [];
    if (draft.linkedInUrl) {
      socialLinks.push({ platform: "linkedin", url: draft.linkedInUrl });
    }
    if (draft.websiteUrl) {
      socialLinks.push({ platform: "website", url: draft.websiteUrl });
    }

    await container.profiles.update(userId, {
      headline: headline ?? undefined,
      bio: summary ?? undefined,
      websiteUrl: draft.websiteUrl ?? undefined,
      skills: acceptedSkills,
      socialLinks: socialLinks.length ? socialLinks : undefined,
    });

    await prisma.profile.update({
      where: { userId },
      data: {
        profileType: draft.profileType as ProfileType,
        expertiseAreas: expertise,
        industries,
        onboardingDraft: { ...draft, step: "ai_questions" } as object,
        onboardingStep: "ai_questions",
        activationStatus: "PROFILE_REVIEWED",
      },
    });

    if (accepted) {
      await trackProfileEvent(userId, "PROFILE_AI_SUGGESTION_ACCEPTED", {
        count: accepted,
      });
    }
    if (rejected) {
      await trackProfileEvent(userId, "PROFILE_AI_SUGGESTION_REJECTED", {
        count: rejected,
      });
    }

    const refreshed = await new ProfileActivationService().refresh(userId);
    return { draft, activation: refreshed?.activation, readiness: refreshed?.readiness };
  }
}
