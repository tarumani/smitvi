import { MARKETPLACE_COMMISSION_RATE } from "@/config/constants";
import { prisma } from "@/infrastructure/database/prisma";

export type FeeCategory =
  | "PRODUCT"
  | "CONSULTATION"
  | "AI_ACCESS"
  | "SUBSCRIPTION";

export class PlatformFeeService {
  async getCommissionRate(category: FeeCategory = "PRODUCT"): Promise<number> {
    const row = await prisma.platformFeeConfig.findUnique({
      where: { category },
    });
    return row?.commissionRate ?? MARKETPLACE_COMMISSION_RATE;
  }

  async calculateSplit(
    grossAmountCents: number,
    category: FeeCategory = "PRODUCT",
  ) {
    const commissionRate = await this.getCommissionRate(category);
    const commissionCents = Math.round(grossAmountCents * commissionRate);
    return {
      commissionRate,
      commissionCents,
      netAmountCents: grossAmountCents - commissionCents,
    };
  }

  async listAll() {
    return prisma.platformFeeConfig.findMany({ orderBy: { category: "asc" } });
  }

  async updateRate(category: FeeCategory, commissionRate: number) {
    if (commissionRate < 0 || commissionRate > 0.5) {
      throw new Error("Commission rate must be between 0 and 0.5");
    }
    return prisma.platformFeeConfig.upsert({
      where: { category },
      create: { category, commissionRate },
      update: { commissionRate },
    });
  }
}
