import { prisma } from "@/infrastructure/database/prisma";
import type { MeaningfulActivityType } from "@/generated/prisma/client";

export async function recordMeaningfulActivity(input: {
  userId: string;
  type: MeaningfulActivityType;
  title: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.meaningfulActivity.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title.slice(0, 240),
      metadata: (input.metadata ?? {}) as object,
    },
  });
  await prisma.profile.updateMany({
    where: { userId: input.userId },
    data: { lastMeaningfulActivityAt: new Date() },
  });
}
