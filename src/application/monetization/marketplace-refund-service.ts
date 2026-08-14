import type { CreatorWalletService } from "@/application/monetization/creator-wallet-service";
import type { MarketplaceEventService } from "@/application/monetization/marketplace-event-service";
import type { ProviderPaymentRefundService } from "@/application/billing/provider-payment-refund-service";
import type { MarketplaceOrderPushNotifier } from "@/application/notifications/marketplace-order-push-notifier";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import type {
  MarketplaceRefundKind,
  MarketplaceRefundStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/infrastructure/database/prisma";

const TERMINAL: MarketplaceRefundStatus[] = ["COMPLETED", "REJECTED", "FAILED"];

function resolveGrossRefundCents(
  orderGross: number,
  amountCents: number | null | undefined,
): number {
  if (amountCents == null) return orderGross;
  return Math.min(orderGross, Math.max(0, amountCents));
}

function isFullGross(orderGross: number, refundGross: number): boolean {
  return refundGross >= orderGross;
}

/** Proportional seller net clawback for a gross refund amount. */
function netClawbackCents(
  orderGross: number,
  orderNet: number,
  refundGross: number,
): number {
  if (orderGross <= 0) return 0;
  if (refundGross >= orderGross) return orderNet;
  return Math.round((orderNet * refundGross) / orderGross);
}

export class MarketplaceRefundService {
  constructor(
    private readonly wallet: CreatorWalletService,
    private readonly events: MarketplaceEventService,
    private readonly providerRefunds: ProviderPaymentRefundService,
    private readonly orderPush?: MarketplaceOrderPushNotifier,
  ) {}

  async getOrderForParticipant(orderId: string, userId: string) {
    return prisma.marketplaceOrder.findFirst({
      where: {
        id: orderId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    });
  }

  async getForOrder(orderId: string) {
    return prisma.marketplaceRefund.findUnique({ where: { orderId } });
  }

  async mapForOrders(orderIds: string[]) {
    if (orderIds.length === 0) return new Map();
    const rows = await prisma.marketplaceRefund.findMany({
      where: { orderId: { in: orderIds } },
    });
    return new Map(rows.map((r) => [r.orderId, r]));
  }

  async listForAdmin(input?: {
    status?: MarketplaceRefundStatus;
    take?: number;
  }) {
    return prisma.marketplaceRefund.findMany({
      where: input?.status ? { status: input.status } : undefined,
      orderBy: { createdAt: "desc" },
      take: input?.take ?? 50,
    });
  }

  /**
   * Buyer requests a refund (full / partial) or opens a dispute.
   * `amountCents` is gross; omit for full order amount.
   */
  async requestRefund(input: {
    buyerId: string;
    orderId: string;
    reason?: string | null;
    amountCents?: number | null;
    kind?: MarketplaceRefundKind;
  }) {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: input.orderId },
      include: { listing: { select: { id: true, title: true } } },
    });
    if (!order) throw new NotFoundError("Order not found");
    if (order.buyerId !== input.buyerId) {
      throw new ValidationError("Only the buyer can request a refund");
    }
    if (order.status !== "PAID" && order.status !== "FULFILLED") {
      throw new ValidationError("Only paid orders can be refunded");
    }

    const kind: MarketplaceRefundKind =
      input.kind ??
      (input.amountCents != null &&
      input.amountCents > 0 &&
      input.amountCents < order.grossAmountCents
        ? "PARTIAL"
        : "FULL");

    const refundGross = resolveGrossRefundCents(
      order.grossAmountCents,
      kind === "FULL" ? null : input.amountCents,
    );
    if (refundGross <= 0) {
      throw new ValidationError("Refund amount must be positive");
    }
    if (refundGross > order.grossAmountCents) {
      throw new ValidationError("Refund amount exceeds order total");
    }

    const full = isFullGross(order.grossAmountCents, refundGross);
    const revokeAccess = full;
    const status: MarketplaceRefundStatus =
      kind === "DISPUTE" ? "DISPUTED" : "REQUESTED";

    const existing = await prisma.marketplaceRefund.findUnique({
      where: { orderId: order.id },
    });
    if (existing) {
      if (TERMINAL.includes(existing.status) && existing.status !== "REJECTED") {
        throw new ValidationError(`Refund already ${existing.status}`);
      }
      if (
        existing.status === "REJECTED" ||
        existing.status === "DISPUTED" ||
        existing.status === "REQUESTED"
      ) {
        return prisma.marketplaceRefund.update({
          where: { id: existing.id },
          data: {
            status,
            kind,
            amountCents: refundGross,
            revokeAccess,
            reason: input.reason?.trim() || existing.reason,
          },
        });
      }
      return existing;
    }

    const refund = await prisma.marketplaceRefund.create({
      data: {
        orderId: order.id,
        status,
        kind,
        amountCents: refundGross,
        revokeAccess,
        reason: input.reason?.trim() || null,
      },
    });

    await this.events.track({
      eventType: "REFUND_CREATED",
      userId: order.buyerId,
      creatorId: order.sellerId,
      listingId: order.listingId,
      orderId: order.id,
      metadata: {
        refundId: refund.id,
        status: refund.status,
        kind: refund.kind,
        amountCents: refund.amountCents,
      },
    });

    if (this.orderPush) {
      void this.orderPush
        .notifySellerRefundRequested({
          sellerUserId: order.sellerId,
          buyerUserId: order.buyerId,
          orderId: order.id,
          listingTitle: order.listing.title,
          netAmountCents: order.netAmountCents,
          currency: order.currency,
        })
        .catch(() => undefined);
    }

    return refund;
  }

  async updateStatus(
    refundId: string,
    status: MarketplaceRefundStatus,
    options?: { skipProvider?: boolean; amountCents?: number },
  ) {
    const existing = await prisma.marketplaceRefund.findUnique({
      where: { id: refundId },
    });
    if (!existing) throw new NotFoundError("Refund not found");

    if (existing.status === "COMPLETED") {
      throw new ValidationError("Completed refunds cannot change status");
    }

    if (status === "COMPLETED") {
      return this.completeRefund(existing.id, options);
    }

    return prisma.marketplaceRefund.update({
      where: { id: refundId },
      data: {
        status,
        ...(options?.amountCents != null
          ? { amountCents: options.amountCents }
          : {}),
      },
    });
  }

  /**
   * Complete refund: provider money-back first, then reverse wallet.
   * Full → revoke access + order REFUNDED; partial → keep access + order PAID.
   */
  async completeRefund(
    refundId: string,
    options?: { skipProvider?: boolean; amountCents?: number },
  ) {
    const refund = await prisma.marketplaceRefund.findUnique({
      where: { id: refundId },
    });
    if (!refund) throw new NotFoundError("Refund not found");
    if (refund.status === "COMPLETED") {
      return {
        refund,
        alreadyCompleted: true,
        reversedCents: 0,
        providerRefund: null as null,
      };
    }

    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: refund.orderId },
      include: {
        listing: { select: { id: true, title: true, salesCount: true } },
      },
    });
    if (!order) throw new NotFoundError("Order not found");

    if (order.status === "REFUNDED" && refund.revokeAccess) {
      const updated = await prisma.marketplaceRefund.update({
        where: { id: refund.id },
        data: { status: "COMPLETED" },
      });
      return {
        refund: updated,
        alreadyCompleted: true,
        reversedCents: 0,
        providerRefund: null as null,
      };
    }

    const refundGross = resolveGrossRefundCents(
      order.grossAmountCents,
      options?.amountCents ?? refund.amountCents,
    );
    if (refundGross <= 0) {
      throw new ValidationError("Refund amount must be positive");
    }

    const full = isFullGross(order.grossAmountCents, refundGross);
    const netReverse = netClawbackCents(
      order.grossAmountCents,
      order.netAmountCents,
      refundGross,
    );

    await prisma.marketplaceRefund.update({
      where: { id: refund.id },
      data: {
        status: "PROCESSING",
        amountCents: refundGross,
        kind: full
          ? refund.kind === "DISPUTE"
            ? "DISPUTE"
            : "FULL"
          : refund.kind === "DISPUTE"
            ? "DISPUTE"
            : "PARTIAL",
        revokeAccess: full,
      },
    });

    let providerRefund: Awaited<
      ReturnType<ProviderPaymentRefundService["refundMarketplaceOrder"]>
    >;

    if (options?.skipProvider) {
      providerRefund = {
        provider: "NONE",
        externalRefundId: null,
        skipped: true,
        skipReason: "skipProvider=true (manual / offline refund)",
      };
    } else if (refund.externalRefundId) {
      providerRefund = {
        provider: order.provider === "STRIPE" ? "STRIPE" : "RAZORPAY",
        externalRefundId: refund.externalRefundId,
        skipped: true,
        skipReason: "Provider refund already recorded",
      };
    } else {
      try {
        providerRefund = await this.providerRefunds.refundMarketplaceOrder({
          orderId: order.id,
          refundId: refund.id,
          amountCents: refundGross,
          currency: order.currency,
          reason: refund.reason,
        });
      } catch (error) {
        await prisma.marketplaceRefund.update({
          where: { id: refund.id },
          data: { status: "FAILED" },
        });
        throw error;
      }
    }

    let reversal: Awaited<
      ReturnType<CreatorWalletService["reverseCreditForOrder"]>
    >;
    try {
      reversal = await this.wallet.reverseCreditForOrder(
        order.id,
        netReverse,
      );
    } catch (error) {
      if (providerRefund.externalRefundId) {
        await prisma.marketplaceRefund.update({
          where: { id: refund.id },
          data: {
            status: "PROCESSING",
            externalRefundId: providerRefund.externalRefundId,
            providerRefundedAt: new Date(),
            amountCents: refundGross,
          },
        });
      } else {
        await prisma.marketplaceRefund.update({
          where: { id: refund.id },
          data: { status: "FAILED" },
        });
      }
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      await tx.marketplaceRefund.update({
        where: { id: refund.id },
        data: {
          status: "COMPLETED",
          amountCents: refundGross,
          revokeAccess: full,
          externalRefundId:
            providerRefund.externalRefundId ?? refund.externalRefundId,
          providerRefundedAt: providerRefund.externalRefundId
            ? new Date()
            : refund.providerRefundedAt,
        },
      });

      if (full) {
        await tx.marketplaceOrder.update({
          where: { id: order.id },
          data: { status: "REFUNDED" },
        });
        await tx.marketplaceAccess.deleteMany({
          where: {
            userId: order.buyerId,
            listingId: order.listingId,
          },
        });
        if (order.listing.salesCount > 0) {
          await tx.marketplaceListing.update({
            where: { id: order.listingId },
            data: { salesCount: { decrement: 1 } },
          });
        }
        await tx.payment.updateMany({
          where: {
            marketplaceOrderId: order.id,
            status: { in: ["SUCCEEDED", "PENDING"] },
          },
          data: { status: "REFUNDED" },
        });
      }
    });

    const completed = await prisma.marketplaceRefund.findUniqueOrThrow({
      where: { id: refund.id },
    });

    await this.events.track({
      eventType: "REFUND_CREATED",
      userId: order.buyerId,
      creatorId: order.sellerId,
      listingId: order.listingId,
      orderId: order.id,
      metadata: {
        refundId: completed.id,
        status: "COMPLETED",
        kind: completed.kind,
        amountCents: refundGross,
        full,
        reversedCents: reversal.reversedCents,
        reversedFrom: reversal.from,
        provider: providerRefund.provider,
        externalRefundId: providerRefund.externalRefundId,
        providerSkipped: providerRefund.skipped,
        providerSkipReason: providerRefund.skipReason,
      },
    });

    if (this.orderPush) {
      void Promise.all([
        this.orderPush.notifyBuyerRefundCompleted({
          buyerUserId: order.buyerId,
          sellerUserId: order.sellerId,
          orderId: order.id,
          listingTitle: order.listing.title,
          grossAmountCents: refundGross,
          currency: order.currency,
        }),
        this.orderPush.notifySellerRefundCompleted({
          sellerUserId: order.sellerId,
          buyerUserId: order.buyerId,
          orderId: order.id,
          listingTitle: order.listing.title,
          netAmountCents: reversal.reversedCents,
          currency: order.currency,
          reversedFrom: reversal.from,
        }),
      ]).catch(() => undefined);
    }

    return {
      refund: completed,
      alreadyCompleted: false,
      reversedCents: reversal.reversedCents,
      reversedFrom: reversal.from,
      refundGrossCents: refundGross,
      full,
      providerRefund,
    };
  }
}
