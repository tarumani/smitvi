import { prisma } from "@/infrastructure/database/prisma";

export class GrowthConversionService {
  async syncUserActivation(userId: string): Promise<void> {
    const prospect = await prisma.growthProspect.findFirst({
      where: { linkedUserId: userId },
    });
    if (!prospect) return;

    const [profile, knowledge, twinReady, firstOrder] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.knowledgeSource.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.knowledgeSource.findFirst({
        where: { userId, status: "READY" },
        orderBy: { updatedAt: "asc" },
      }),
      prisma.marketplaceOrder.findFirst({
        where: {
          sellerId: userId,
          status: { in: ["PAID", "FULFILLED"] },
        },
        orderBy: { paidAt: "asc" },
      }),
    ]);

    const revenueAgg = await prisma.marketplaceOrder.aggregate({
      where: {
        sellerId: userId,
        status: { in: ["PAID", "FULFILLED"] },
      },
      _sum: { netAmountCents: true },
    });

    const registeredAt = profile?.createdAt ?? null;
    const activatedAt = profile?.isOnboarded ? profile.updatedAt : null;

    const existing = await prisma.growthConversion.findFirst({
      where: { prospectId: prospect.id },
    });

    const data = {
      userId,
      registeredAt,
      activatedAt,
      firstKnowledgeAt: knowledge?.createdAt ?? null,
      twinReadyAt: twinReady?.updatedAt ?? null,
      firstSaleAt: firstOrder?.paidAt ?? null,
      revenueCents: revenueAgg._sum.netAmountCents ?? 0,
    };

    if (existing) {
      await prisma.growthConversion.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.growthConversion.create({
        data: { prospectId: prospect.id, ...data },
      });
    }

    let status = prospect.status;
    if (firstOrder) status = "MONETIZED";
    else if (twinReady) status = "CREATOR";
    else if (activatedAt) status = "ACTIVATED";
    else if (registeredAt) status = "REGISTERED";

    if (status !== prospect.status) {
      await prisma.growthProspect.update({
        where: { id: prospect.id },
        data: { status },
      });
    }
  }

  async linkProspectToUser(prospectId: string, userId: string) {
    await prisma.growthProspect.update({
      where: { id: prospectId },
      data: { linkedUserId: userId, status: "REGISTERED" },
    });
    await this.syncUserActivation(userId);
  }
}
