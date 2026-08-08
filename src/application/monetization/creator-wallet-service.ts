import { prisma } from "@/infrastructure/database/prisma";

export class CreatorWalletService {
  async getOrCreate(userId: string, currency = "USD") {
    return prisma.creatorWallet.upsert({
      where: { userId },
      create: { userId, currency },
      update: {},
    });
  }

  async creditFromOrder(input: {
    sellerId: string;
    netAmountCents: number;
    currency: string;
  }) {
    await this.getOrCreate(input.sellerId, input.currency);
    return prisma.creatorWallet.update({
      where: { userId: input.sellerId },
      data: {
        pendingBalanceCents: { increment: input.netAmountCents },
        lifetimeEarningsCents: { increment: input.netAmountCents },
      },
    });
  }

  async releasePendingToAvailable(userId: string, amountCents: number) {
    const wallet = await this.getOrCreate(userId);
    const release = Math.min(wallet.pendingBalanceCents, amountCents);
    if (release <= 0) return wallet;

    return prisma.creatorWallet.update({
      where: { userId },
      data: {
        pendingBalanceCents: { decrement: release },
        availableBalanceCents: { increment: release },
      },
    });
  }

  async requestPayout(userId: string, minimumCents = 1000) {
    const wallet = await this.getOrCreate(userId);
    if (wallet.availableBalanceCents < minimumCents) {
      throw new Error("Below minimum payout threshold");
    }

    const amount = wallet.availableBalanceCents;
    await prisma.$transaction([
      prisma.creatorWallet.update({
        where: { userId },
        data: { availableBalanceCents: 0 },
      }),
      prisma.creatorPayout.create({
        data: {
          userId,
          amountCents: amount,
          currency: wallet.currency,
          status: "PENDING",
        },
      }),
    ]);

    return { amountCents: amount, currency: wallet.currency };
  }
}
