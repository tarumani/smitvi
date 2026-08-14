import { prisma } from "@/infrastructure/database/prisma";
import { AnalyzeProfileNarrative } from "@/application/onboarding/analyze-profile-narrative";
import { selectMissingQuestions } from "@/domain/profile/missing-questions";
import { trackProfileEvent } from "@/application/onboarding/onboarding-helpers";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";
import type { ProfileTypeId } from "@/domain/profile/activation";
import { parseStringArray } from "@/application/onboarding/onboarding-helpers";

export class ImproveProfileWithAi {
  async execute(userId: string, email: string, extraNarrative?: string) {
    await trackProfileEvent(userId, "PROFILE_IMPROVE_WITH_AI_STARTED", {});
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        experiences: true,
        portfolio: true,
      },
    });
    if (!profile) {
      return { draft: null, questions: [] };
    }

    const parts = [
      extraNarrative?.trim(),
      profile.headline,
      profile.bio,
      profile.skills.map((s) => s.skill.name).join(", "),
      profile.experiences.map((e) => `${e.title} at ${e.company}`).join(". "),
      profile.portfolio.map((p) => p.title).join(". "),
    ].filter(Boolean);

    const narrative = parts.join("\n");
    const type = (profile.profileType ?? "PROFESSIONAL") as ProfileTypeId;

    if (narrative.replace(/\s/g, "").length < 12) {
      const snapshot = await new ProfileActivationService().gather(userId);
      return {
        draft: null,
        questions: selectMissingQuestions({
          profileType: type,
          draft: null,
          confirmedSkillCount: profile.skills.length,
          hasProject: profile.portfolio.length > 0,
          expertiseCount: parseStringArray(profile.expertiseAreas).length,
        }),
        readiness: snapshot?.readiness,
        lowInformation: true,
      };
    }

    const analyzed = await new AnalyzeProfileNarrative().execute({
      userId,
      email,
      narrative,
      profileType: type,
      keepExisting: true,
    });

    const questions = selectMissingQuestions({
      profileType: type,
      draft: analyzed.draft,
      confirmedSkillCount: profile.skills.length,
      hasProject: profile.portfolio.length > 0,
      expertiseCount: parseStringArray(profile.expertiseAreas).length,
    });

    await trackProfileEvent(userId, "PROFILE_IMPROVE_WITH_AI_COMPLETED", {
      questionCount: questions.length,
    });

    return { ...analyzed, questions };
  }
}
