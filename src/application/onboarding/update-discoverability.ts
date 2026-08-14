import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { ValidationError } from "@/domain/shared/errors";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";

const schema = z.object({
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).optional(),
  appearInExpertDiscovery: z.boolean().optional(),
  publicTwinEnabled: z.boolean().optional(),
  allowRecommendations: z.boolean().optional(),
});

export class UpdateDiscoverability {
  async execute(userId: string, raw: unknown) {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) throw new ValidationError("Invalid discoverability settings");

    const data = parsed.data;
    await prisma.profile.update({
      where: { userId },
      data: {
        visibility: data.visibility,
        appearInExpertDiscovery: data.appearInExpertDiscovery,
        publicTwinEnabled: data.publicTwinEnabled,
        allowRecommendations: data.allowRecommendations,
      },
    });

    const refreshed = await new ProfileActivationService().refresh(userId);
    return {
      visibility: refreshed?.profile.visibility,
      appearInExpertDiscovery: data.appearInExpertDiscovery,
      publicTwinEnabled: data.publicTwinEnabled,
      allowRecommendations: data.allowRecommendations,
      activationStatus: refreshed?.activationStatus,
    };
  }
}
