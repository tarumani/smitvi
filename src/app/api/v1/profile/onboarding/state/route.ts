import { requireSession } from "@/application/auth/get-current-session";
import { prisma } from "@/infrastructure/database/prisma";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { selectMissingQuestions } from "@/domain/profile/missing-questions";
import { parseStringArray } from "@/application/onboarding/onboarding-helpers";
import type { ProfileAiDraft } from "@/domain/profile/profile-extraction";
import type { ProfileTypeId } from "@/domain/profile/activation";

export async function GET() {
  try {
    const session = await requireSession();
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { skills: true, portfolio: true },
    });
    const draft = (profile?.onboardingDraft ?? null) as ProfileAiDraft | null;
    const questions = selectMissingQuestions({
      profileType: (profile?.profileType ?? null) as ProfileTypeId | null,
      draft,
      confirmedSkillCount: profile?.skills.length ?? 0,
      hasProject: (profile?.portfolio.length ?? 0) > 0,
      expertiseCount: parseStringArray(profile?.expertiseAreas).length,
    });
    return jsonOk({
      profileType: profile?.profileType ?? null,
      activationStatus: profile?.activationStatus ?? "REGISTERED",
      onboardingStep: profile?.onboardingStep ?? "ai_welcome",
      draft,
      questions,
      username: profile?.username ?? null,
      headline: profile?.headline ?? null,
      bio: profile?.bio ?? null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
