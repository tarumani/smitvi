import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { intelligenceItemSchema } from "@/domain/intelligence/update-extraction";
import { GenerateProjectFromNarrative } from "@/application/onboarding/generate-project-from-narrative";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";
import { recordMeaningfulActivity } from "@/application/intelligence/record-meaningful-activity";
import { parseStringArray } from "@/application/onboarding/onboarding-helpers";

const confirmSchema = z.object({
  narrative: z.string().min(8).max(4000),
  visibility: z.enum(["PRIVATE", "PROFILE", "PUBLIC"]).default("PROFILE"),
  items: z.array(intelligenceItemSchema.extend({ selected: z.boolean() })),
  teachTwin: z.boolean().optional(),
});

export class ConfirmIntelligenceUpdate {
  async execute(userId: string, raw: unknown) {
    const parsed = confirmSchema.safeParse(raw);
    if (!parsed.success) throw new ValidationError("Invalid intelligence update");
    const { narrative, visibility, items, teachTwin } = parsed.data;
    const selected = items.filter((i) => i.selected);
    if (selected.length === 0) {
      throw new ValidationError("Select at least one item or discard the update.");
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { skills: { include: { skill: true } } },
    });
    if (!profile) throw new ValidationError("Profile not found");

    const skills = selected
      .filter((i) => i.category === "skill" || i.category === "expertise")
      .map((i) => i.value);
    const industries = selected
      .filter((i) => i.category === "industry")
      .map((i) => i.value);
    const expertise = selected
      .filter((i) => i.category === "expertise" || i.category === "topic")
      .map((i) => i.value);
    const projectItem = selected.find((i) => i.category === "project");

    if (visibility !== "PRIVATE") {
      if (skills.length) {
        const merged = [
          ...new Set([...profile.skills.map((s) => s.skill.name), ...skills]),
        ].slice(0, 30);
        await container.profiles.update(userId, { skills: merged });
      }
      const nextIndustries = [
        ...new Set([...parseStringArray(profile.industries), ...industries]),
      ];
      const nextExpertise = [
        ...new Set([...parseStringArray(profile.expertiseAreas), ...expertise]),
      ];
      await prisma.profile.update({
        where: { userId },
        data: {
          industries: nextIndustries,
          expertiseAreas: nextExpertise,
        },
      });
      if (projectItem) {
        await new GenerateProjectFromNarrative().execute(
          userId,
          `${projectItem.value}. ${narrative}`,
          true,
        );
      }
    }

    await recordMeaningfulActivity({
      userId,
      type: teachTwin ? "TWIN_TAUGHT" : "INTELLIGENCE_UPDATE",
      title: projectItem
        ? `Added ${projectItem.value}`
        : skills[0]
          ? `Added ${skills[0]} skill`
          : "Intelligence update",
      metadata: {
        visibility,
        itemCount: selected.length,
        teachTwin: Boolean(teachTwin),
      },
    });

    await container.auditLogs.create({
      actorId: userId,
      action: "INTELLIGENCE_UPDATE_CONFIRMED",
      entityType: "profile",
      entityId: profile.id,
      metadata: { visibility, count: selected.length },
    });

    const refreshed = await new ProfileActivationService().refresh(userId);
    return {
      applied: visibility !== "PRIVATE",
      visibility,
      readiness: refreshed?.readiness,
    };
  }
}
