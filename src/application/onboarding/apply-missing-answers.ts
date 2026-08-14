import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { extractProfileFromNarrative } from "@/application/onboarding/profile-ai-extraction";
import { GenerateProjectFromNarrative } from "@/application/onboarding/generate-project-from-narrative";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";
import { parseStringArray } from "@/application/onboarding/onboarding-helpers";
import type { ProfileTypeId } from "@/domain/profile/activation";

const schema = z.object({
  discoveryIntent: z.array(z.string()).max(8).optional(),
  proudProject: z.string().max(2000).optional(),
  helpTopics: z.string().max(2000).optional(),
});

export class ApplyMissingAnswers {
  async execute(userId: string, raw: unknown) {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) throw new ValidationError("Invalid answers");
    const { discoveryIntent, proudProject, helpTopics } = parsed.data;

    if (proudProject?.trim()) {
      await new GenerateProjectFromNarrative().execute(
        userId,
        proudProject,
        true,
      );
    }

    if (helpTopics?.trim()) {
      const profile = await prisma.profile.findUnique({
        where: { userId },
        include: { skills: { include: { skill: true } } },
      });
      const type = (profile?.profileType ?? "PROFESSIONAL") as ProfileTypeId;
      const extracted = await extractProfileFromNarrative({
        narrative: helpTopics,
        selectedType: type,
      });
      const existing = profile?.skills.map((s) => s.skill.name) ?? [];
      const skills = [
        ...new Set([
          ...existing,
          ...extracted.skills.map((s) => s.value),
          ...extracted.expertiseAreas.map((s) => s.value),
        ]),
      ].slice(0, 30);
      await container.profiles.update(userId, { skills });
      const expertise = [
        ...new Set([
          ...parseStringArray(profile?.expertiseAreas),
          ...extracted.expertiseAreas.map((s) => s.value),
        ]),
      ];
      await prisma.profile.update({
        where: { userId },
        data: {
          expertiseAreas: expertise,
          interests: discoveryIntent ?? parseStringArray(profile?.interests),
        },
      });
    } else if (discoveryIntent?.length) {
      await prisma.profile.update({
        where: { userId },
        data: { interests: discoveryIntent },
      });
    }

    return new ProfileActivationService().refresh(userId);
  }
}
