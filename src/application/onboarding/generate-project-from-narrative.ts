import { prisma } from "@/infrastructure/database/prisma";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { extractProjectFromNarrative } from "@/application/onboarding/profile-ai-extraction";
import { toReviewable, uniqueByValue } from "@/domain/profile/profile-extraction";
import { trackProfileEvent } from "@/application/onboarding/onboarding-helpers";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";

export class GenerateProjectFromNarrative {
  async execute(userId: string, narrative: string, save?: boolean) {
    const text = narrative.trim();
    if (text.length < 12) {
      throw new ValidationError("Tell us a bit more about the project.");
    }

    const extracted = await extractProjectFromNarrative(text);
    const skills = uniqueByValue(extracted.skills.map(toReviewable));

    const suggestion = {
      title: extracted.title,
      role: extracted.role,
      description: extracted.description,
      skills,
      industry: extracted.industry,
      outcomes: extracted.outcomes,
      source: "AI_INFERRED" as const,
      status: "PENDING_USER_REVIEW" as const,
    };

    await trackProfileEvent(userId, "PROFILE_PROJECT_GENERATED", {
      titleLength: extracted.title.length,
    });

    if (!save) {
      return { suggestion };
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { portfolio: true, skills: { include: { skill: true } } },
    });
    if (!profile) throw new ValidationError("Profile not found");

    const existingSkills = profile.skills.map((s) => s.skill.name);
    const mergedSkills = [
      ...new Set([
        ...existingSkills,
        ...skills
          .filter((s) => s.status !== "REJECTED")
          .map((s) => s.value),
      ]),
    ].slice(0, 30);

    const portfolio = [
      ...profile.portfolio.map((p) => ({
        title: p.title,
        description: p.description,
        url: p.url,
        imageUrl: p.imageUrl,
      })),
      {
        title: extracted.title,
        description: extracted.description,
        url: null,
        imageUrl: null,
      },
    ];

    await container.profiles.update(userId, {
      skills: mergedSkills,
      portfolio,
    });

    if (extracted.industry) {
      const industries = Array.isArray(profile.industries)
        ? (profile.industries as unknown[]).filter(
            (i): i is string => typeof i === "string",
          )
        : [];
      if (!industries.includes(extracted.industry)) {
        await prisma.profile.update({
          where: { userId },
          data: { industries: [...industries, extracted.industry] },
        });
      }
    }

    await new ProfileActivationService().refresh(userId);
    const { recordMeaningfulActivity } = await import(
      "@/application/intelligence/record-meaningful-activity"
    );
    await recordMeaningfulActivity({
      userId,
      type: "PROJECT_ADDED",
      title: `Added ${extracted.title}`,
    });
    return { suggestion, saved: true };
  }
}
