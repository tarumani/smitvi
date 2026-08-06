import { CompleteOnboarding } from "@/application/profile/complete-onboarding";
import { calculateIntelligenceScore } from "@/application/onboarding/calculate-intelligence-score";
import {
  ONBOARDING_FLOW_STEPS,
  ONBOARDING_PROFESSIONS,
  type OnboardingFlowStep,
} from "@/config/onboarding-flow";
import { UnauthorizedError, ValidationError } from "@/domain/shared/errors";
import { container } from "@/application/container";
import { prisma } from "@/infrastructure/database/prisma";

type StepBody = {
  step?: string;
  skip?: boolean;
  professionId?: string;
  interests?: string[];
  bio?: string;
  headline?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
};

export class SaveOnboardingStep {
  async execute(userId: string, email: string, raw: unknown) {
    if (!userId) throw new UnauthorizedError();

    const body = (typeof raw === "object" && raw !== null ? raw : {}) as StepBody;
    const step = body.step;
    if (!step || !ONBOARDING_FLOW_STEPS.includes(step as OnboardingFlowStep)) {
      throw new ValidationError("Invalid onboarding step");
    }

    await this.ensureProfile(userId, email);

    switch (step as OnboardingFlowStep) {
      case "welcome":
        return this.advance(userId, "profession");
      case "profession": {
        if (!body.professionId) {
          throw new ValidationError("Choose a profession to continue");
        }
        const def = ONBOARDING_PROFESSIONS.find((p) => p.id === body.professionId);
        await prisma.profile.update({
          where: { userId },
          data: {
            profession: def?.label ?? body.professionId,
            hubArchetypeId: def?.archetype ?? "OTHER",
            onboardingStep: "interests",
            intelligencePoints: { increment: 10 },
          },
        });
        return { nextStep: "interests" };
      }
      case "interests": {
        const list = Array.isArray(body.interests)
          ? body.interests.filter((i) => typeof i === "string").slice(0, 12)
          : [];
        if (!body.skip && list.length < 3) {
          throw new ValidationError("Select at least 3 interests");
        }
        await prisma.profile.update({
          where: { userId },
          data: {
            interests: list,
            onboardingStep: "photo",
            ...(list.length >= 3
              ? { intelligencePoints: { increment: 10 } }
              : {}),
          },
        });
        if (list.length >= 3) {
          await this.syncInterestSkills(userId, list);
        }
        return { nextStep: "photo" };
      }
      case "photo":
        await prisma.profile.update({
          where: { userId },
          data: {
            ...(body.avatarUrl ? { avatarUrl: body.avatarUrl } : {}),
            onboardingStep: "bio",
            ...(body.avatarUrl
              ? { intelligencePoints: { increment: 10 } }
              : {}),
          },
        });
        return { nextStep: "bio" };
      case "bio": {
        const username = body.username?.trim().toLowerCase();
        const displayName = body.displayName?.trim();
        if (!username || username.length < 3) {
          throw new ValidationError("Choose a username (3+ characters)");
        }
        if (!displayName) {
          throw new ValidationError("Display name is required");
        }
        const taken = await container.profiles.usernameExists(username, userId);
        if (taken) throw new ValidationError("Username is already taken");

        await prisma.profile.update({
          where: { userId },
          data: {
            username,
            displayName,
            bio: body.bio?.trim() || null,
            headline: body.headline?.trim() || null,
            onboardingStep: "knowledge",
            ...(body.bio?.trim()
              ? { intelligencePoints: { increment: 10 } }
              : {}),
          },
        });
        return { nextStep: "knowledge" };
      }
      case "knowledge":
        await prisma.profile.update({
          where: { userId },
          data: { onboardingStep: "follow" },
        });
        return { nextStep: "follow" };
      case "follow":
        await prisma.profile.update({
          where: { userId },
          data: {
            onboardingStep: "score",
            ...(body.skip ? {} : { intelligencePoints: { increment: 10 } }),
          },
        });
        return { nextStep: "score" };
      case "score": {
        await new CompleteOnboarding(container.profiles, container.auditLogs).execute(
          userId,
        );
        const score = await this.refreshScore(userId);
        return { nextStep: null, completed: true, score };
      }
      default:
        throw new ValidationError("Unsupported step");
    }
  }

  private async advance(userId: string, next: OnboardingFlowStep) {
    await prisma.profile.update({
      where: { userId },
      data: { onboardingStep: next },
    });
    return { nextStep: next };
  }

  private async ensureProfile(userId: string, email: string) {
    const existing = await container.profiles.findByUserId(userId);
    if (existing) return existing;

    const base =
      email
        .split("@")[0]
        ?.replace(/[^a-z0-9]/gi, "")
        .toLowerCase()
        .slice(0, 20) || "member";
    let username = base;
    let suffix = 0;
    while (await container.profiles.usernameExists(username)) {
      suffix += 1;
      username = `${base}${suffix}`;
    }

    await container.profiles.create(userId, {
      username,
      displayName: base,
      visibility: "PUBLIC",
      publicTwinEnabled: true,
      skills: [],
      socialLinks: [],
      portfolio: [],
      onboardingStep: "welcome",
    });
  }

  private async syncInterestSkills(userId: string, interests: string[]) {
    await container.profiles.update(userId, {
      skills: interests.slice(0, 8),
    });
  }

  private async refreshScore(userId: string) {
    const profile = await container.profiles.findByUserId(userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const knowledgeCount = (
      await container.knowledge.listByUser(userId)
    ).length;
    const interestList = profile
      ? parseInterests(profile as { interests?: unknown })
      : 0;
    const score = calculateIntelligenceScore({
      hasAvatar: Boolean(profile?.avatarUrl),
      hasProfession: Boolean(
        (profile as { profession?: string | null })?.profession,
      ),
      interestCount: interestList,
      hasBio: Boolean(profile?.bio?.trim()),
      knowledgeSourceCount: knowledgeCount,
      followingCount: profile?.followingCount ?? 0,
      emailVerified: Boolean(user?.emailVerified),
    });
    await prisma.profile.update({
      where: { userId },
      data: { intelligencePoints: score.points },
    });
    return score;
  }
}

function parseInterests(profile: { interests?: unknown }): number {
  if (Array.isArray(profile.interests)) return profile.interests.length;
  return 0;
}
