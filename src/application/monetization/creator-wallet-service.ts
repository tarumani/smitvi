import { prisma } from "@/infrastructure/database/prisma";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import type { CreatorPayoutStatus } from "@/generated/prisma/enums";

function holdDaysFromEnv(fallback = 7): number {
  const n = Number(process.env.CREATOR_PENDING_HOLD_DAYS ?? String(fallback));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export class CreatorWalletService {
  async getOrCreate(userId: string, currency = "USD") {
    return prisma.creatorWallet.upsert({
      where: { userId },
      create: { userId, currency },
      update: {},
    });
  }

  /**
   * Wallet balances + open pending credits (per-sale hold ages).
   */
  async getWalletSummary(userId: string, holdDays = holdDaysFromEnv()) {
    const wallet = await this.getOrCreate(userId);
    const pendingCredits = await prisma.creatorPendingCredit.findMany({
      where: { userId, status: "PENDING" },
      orderBy: { creditedAt: "asc" },
      take: 50,
    });

    const nextEligibleAt =
      pendingCredits.length > 0
        ? addDays(pendingCredits[0]!.creditedAt, holdDays)
        : null;

    return {
      wallet,
      holdDays,
      nextEligibleAt,
      pendingCredits: pendingCredits.map((c) => ({
        id: c.id,
        orderId: c.orderId,
        amountCents: c.amountCents,
        currency: c.currency,
        creditedAt: c.creditedAt,
        availableAt: addDays(c.creditedAt, holdDays),
      })),
    };
  }

  async creditFromOrder(input: {
    sellerId: string;
    netAmountCents: number;
    currency: string;
    orderId?: string;
  }) {
    if (input.netAmountCents <= 0) {
      return this.getOrCreate(input.sellerId, input.currency);
    }

    if (input.orderId) {
      const existing = await prisma.creatorPendingCredit.findUnique({
        where: { orderId: input.orderId },
      });
      if (existing) {
        return this.getOrCreate(input.sellerId, input.currency);
      }
    }

    return prisma.$transaction(async (tx) => {
      await tx.creatorWallet.upsert({
        where: { userId: input.sellerId },
        create: { userId: input.sellerId, currency: input.currency },
        update: {},
      });

      try {
        await tx.creatorPendingCredit.create({
          data: {
            userId: input.sellerId,
            orderId: input.orderId,
            amountCents: input.netAmountCents,
            currency: input.currency,
            status: "PENDING",
            creditedAt: new Date(),
          },
        });
      } catch {
        // Unique orderId race — treat as already credited
        if (input.orderId) {
          return tx.creatorWallet.findUniqueOrThrow({
            where: { userId: input.sellerId },
          });
        }
        throw new ValidationError("Could not record pending credit");
      }

      return tx.creatorWallet.update({
        where: { userId: input.sellerId },
        data: {
          pendingBalanceCents: { increment: input.netAmountCents },
          lifetimeEarningsCents: { increment: input.netAmountCents },
        },
      });
    });
  }

  /**
   * Reverse a sale credit for a refunded order (full or partial).
   * PENDING → drop pending; SETTLED → claw back available.
   * Partial: reduce ledger amount and leave status PENDING/SETTLED.
   * Idempotent when already REVERSED (full).
   */
  async reverseCreditForOrder(orderId: string, amountCents?: number) {
    const credit = await prisma.creatorPendingCredit.findUnique({
      where: { orderId },
    });

    if (!credit) {
      return {
        reversedCents: 0,
        from: "none" as const,
        alreadyReversed: false,
        partial: false,
      };
    }

    if (credit.status === "REVERSED") {
      return {
        reversedCents: 0,
        from: "none" as const,
        alreadyReversed: true,
        partial: false,
      };
    }

    const amount =
      amountCents === undefined
        ? credit.amountCents
        : Math.min(credit.amountCents, Math.max(0, amountCents));
    if (amount <= 0) {
      return {
        reversedCents: 0,
        from: "none" as const,
        alreadyReversed: false,
        partial: false,
      };
    }

    const isFull = amount >= credit.amountCents;
    const userId = credit.userId;

    if (credit.status === "PENDING") {
      await prisma.$transaction(async (tx) => {
        if (isFull) {
          await tx.creatorPendingCredit.update({
            where: { id: credit.id },
            data: { status: "REVERSED", settledAt: new Date() },
          });
        } else {
          await tx.creatorPendingCredit.update({
            where: { id: credit.id },
            data: { amountCents: credit.amountCents - amount },
          });
        }
        await tx.creatorWallet.update({
          where: { userId },
          data: {
            pendingBalanceCents: { decrement: amount },
            lifetimeEarningsCents: { decrement: amount },
          },
        });
      });
      return {
        reversedCents: amount,
        from: "pending" as const,
        alreadyReversed: false,
        partial: !isFull,
      };
    }

    // SETTLED — claw back from available
    const wallet = await this.getOrCreate(userId);
    if (wallet.availableBalanceCents < amount) {
      throw new ValidationError(
        `Seller available balance (${wallet.availableBalanceCents}) is less than refund (${amount}). Pause payouts or wait for funds, then retry.`,
      );
    }

    await prisma.$transaction(async (tx) => {
      if (isFull) {
        await tx.creatorPendingCredit.update({
          where: { id: credit.id },
          data: { status: "REVERSED" },
        });
      } else {
        await tx.creatorPendingCredit.update({
          where: { id: credit.id },
          data: { amountCents: credit.amountCents - amount },
        });
      }
      await tx.creatorWallet.update({
        where: { userId },
        data: {
          availableBalanceCents: { decrement: amount },
          lifetimeEarningsCents: { decrement: amount },
        },
      });
    });

    return {
      reversedCents: amount,
      from: "available" as const,
      alreadyReversed: false,
      partial: !isFull,
    };
  }

  /**
   * Settle oldest pending ledger credits first (FIFO), up to amountCents.
   * Keeps wallet.pending/available in sync with ledger.
   */
  async releasePendingToAvailable(userId: string, amountCents?: number) {
    const wallet = await this.getOrCreate(userId);
    if (wallet.pendingBalanceCents <= 0) {
      return { wallet, settledCents: 0 };
    }

    const target =
      amountCents === undefined
        ? wallet.pendingBalanceCents
        : Math.min(wallet.pendingBalanceCents, amountCents);
    if (target <= 0) return { wallet, settledCents: 0 };

    const credits = await prisma.creatorPendingCredit.findMany({
      where: { userId, status: "PENDING" },
      orderBy: { creditedAt: "asc" },
    });

    let remaining = target;
    const toSettle: Array<{ id: string; amountCents: number }> = [];
    for (const c of credits) {
      if (remaining <= 0) break;
      if (c.amountCents <= remaining) {
        toSettle.push({ id: c.id, amountCents: c.amountCents });
        remaining -= c.amountCents;
      } else {
        // Partial settle: mark credit settled for remaining slice by splitting
        // into settled portion + residual pending credit.
        toSettle.push({ id: c.id, amountCents: remaining });
        remaining = 0;
      }
    }

    // If no ledger rows (legacy drift), fall back to balance-only move
    if (toSettle.length === 0) {
      const release = target;
      const updated = await prisma.creatorWallet.update({
        where: { userId },
        data: {
          pendingBalanceCents: { decrement: release },
          availableBalanceCents: { increment: release },
        },
      });
      return { wallet: updated, settledCents: release };
    }

    const settledCents = toSettle.reduce((s, x) => s + x.amountCents, 0);
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of toSettle) {
        const credit = await tx.creatorPendingCredit.findUniqueOrThrow({
          where: { id: item.id },
        });
        if (credit.status !== "PENDING") continue;

        if (item.amountCents >= credit.amountCents) {
          await tx.creatorPendingCredit.update({
            where: { id: credit.id },
            data: { status: "SETTLED", settledAt: now },
          });
        } else {
          // Split: settle this credit for partial amount, leave residual pending
          await tx.creatorPendingCredit.update({
            where: { id: credit.id },
            data: {
              status: "SETTLED",
              settledAt: now,
              amountCents: item.amountCents,
            },
          });
          await tx.creatorPendingCredit.create({
            data: {
              userId,
              orderId: null,
              amountCents: credit.amountCents - item.amountCents,
              currency: credit.currency,
              status: "PENDING",
              creditedAt: credit.creditedAt,
            },
          });
        }
      }

      return tx.creatorWallet.update({
        where: { userId },
        data: {
          pendingBalanceCents: { decrement: settledCents },
          availableBalanceCents: { increment: settledCents },
        },
      });
    });

    return { wallet: updated, settledCents };
  }

  async listPayouts(userId: string, take = 20) {
    return prisma.creatorPayout.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  async listPayoutsForAdmin(input?: {
    status?: CreatorPayoutStatus;
    take?: number;
  }) {
    return prisma.creatorPayout.findMany({
      where: input?.status ? { status: input.status } : undefined,
      orderBy: { createdAt: "desc" },
      take: input?.take ?? 50,
      include: {
        user: {
          include: {
            profile: { select: { username: true, displayName: true } },
          },
        },
      },
    });
  }

  async updatePayoutStatus(
    payoutId: string,
    input: {
      status: CreatorPayoutStatus;
      externalRef?: string | null;
      failureReason?: string | null;
    },
  ) {
    const existing = await prisma.creatorPayout.findUnique({
      where: { id: payoutId },
    });
    if (!existing) throw new NotFoundError("Payout not found");

    if (existing.status === "PAID" && input.status !== "PAID") {
      throw new ValidationError("Paid payouts cannot change status");
    }

    const payout = await prisma.creatorPayout.update({
      where: { id: payoutId },
      data: {
        status: input.status,
        externalRef:
          input.externalRef !== undefined
            ? input.externalRef
            : existing.externalRef,
        failureReason:
          input.failureReason !== undefined
            ? input.failureReason
            : existing.failureReason,
        paidAt: input.status === "PAID" ? new Date() : existing.paidAt,
      },
    });

    return {
      payout,
      previousStatus: existing.status,
      becamePaid: existing.status !== "PAID" && input.status === "PAID",
    };
  }

  /**
   * Settle pending ledger credits older than holdDays (per credit.creditedAt).
   */
  async settleDuePending(holdDays = holdDaysFromEnv(), limit = 200) {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - holdDays);

    const due = await prisma.creatorPendingCredit.findMany({
      where: {
        status: "PENDING",
        creditedAt: { lte: cutoff },
        user: {
          creatorWallet: {
            status: "ACTIVE",
          },
        },
      },
      take: limit,
      orderBy: { creditedAt: "asc" },
      select: {
        id: true,
        userId: true,
        amountCents: true,
        currency: true,
      },
    });

    const byUser = new Map<
      string,
      { currency: string; amountCents: number; creditIds: string[] }
    >();

    for (const row of due) {
      const agg = byUser.get(row.userId);
      if (agg) {
        agg.amountCents += row.amountCents;
        agg.creditIds.push(row.id);
      } else {
        byUser.set(row.userId, {
          currency: row.currency,
          amountCents: row.amountCents,
          creditIds: [row.id],
        });
      }
    }

    const settled: Array<{
      userId: string;
      settledCents: number;
      currency: string;
    }> = [];
    const now = new Date();

    for (const [userId, agg] of byUser) {
      const result = await prisma.$transaction(async (tx) => {
        const open = await tx.creatorPendingCredit.findMany({
          where: {
            id: { in: agg.creditIds },
            status: "PENDING",
          },
          select: { id: true, amountCents: true },
        });
        if (open.length === 0) return { settledCents: 0 };

        const settledCents = open.reduce((s, r) => s + r.amountCents, 0);
        await tx.creatorPendingCredit.updateMany({
          where: {
            id: { in: open.map((r) => r.id) },
            status: "PENDING",
          },
          data: { status: "SETTLED", settledAt: now },
        });

        await tx.creatorWallet.update({
          where: { userId },
          data: {
            pendingBalanceCents: { decrement: settledCents },
            availableBalanceCents: { increment: settledCents },
          },
        });

        return { settledCents };
      });

      if (result.settledCents > 0) {
        settled.push({
          userId,
          settledCents: result.settledCents,
          currency: agg.currency,
        });
      }
    }

    return {
      holdDays,
      considered: due.length,
      settled,
    };
  }

  async requestPayout(userId: string, minimumCents = 1000) {
    const wallet = await this.getOrCreate(userId);
    if (wallet.availableBalanceCents < minimumCents) {
      throw new ValidationError(
        `Minimum payout is ${(minimumCents / 100).toFixed(2)} ${wallet.currency}`,
      );
    }

    const amount = wallet.availableBalanceCents;
    const payout = await prisma.$transaction(async (tx) => {
      await tx.creatorWallet.update({
        where: { userId },
        data: { availableBalanceCents: 0 },
      });
      return tx.creatorPayout.create({
        data: {
          userId,
          amountCents: amount,
          currency: wallet.currency,
          status: "PENDING",
        },
      });
    });

    return {
      payout,
      amountCents: amount,
      currency: wallet.currency,
    };
  }
}
