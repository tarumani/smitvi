import type { Plan, PaymentProvider, SubscriptionStatus, PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/infrastructure/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export class PrismaBillingRepository {
  async getActiveSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async listPayments(userId: string, take = 20) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  async upsertSubscription(input: {
    userId: string;
    plan: Plan;
    provider: PaymentProvider;
    status: SubscriptionStatus;
    externalCustomerId?: string | null;
    externalSubscriptionId?: string | null;
    externalPriceId?: string | null;
    cancelAtPeriodEnd?: boolean;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    canceledAt?: Date | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    if (input.externalSubscriptionId) {
      return prisma.subscription.upsert({
        where: { externalSubscriptionId: input.externalSubscriptionId },
        create: {
          userId: input.userId,
          plan: input.plan,
          provider: input.provider,
          status: input.status,
          externalCustomerId: input.externalCustomerId,
          externalSubscriptionId: input.externalSubscriptionId,
          externalPriceId: input.externalPriceId,
          cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
          currentPeriodStart: input.currentPeriodStart,
          currentPeriodEnd: input.currentPeriodEnd,
          canceledAt: input.canceledAt,
          metadata: input.metadata,
        },
        update: {
          plan: input.plan,
          status: input.status,
          externalCustomerId: input.externalCustomerId,
          externalPriceId: input.externalPriceId,
          cancelAtPeriodEnd: input.cancelAtPeriodEnd,
          currentPeriodStart: input.currentPeriodStart,
          currentPeriodEnd: input.currentPeriodEnd,
          canceledAt: input.canceledAt,
          metadata: input.metadata,
        },
      });
    }

    return prisma.subscription.create({
      data: {
        userId: input.userId,
        plan: input.plan,
        provider: input.provider,
        status: input.status,
        externalCustomerId: input.externalCustomerId,
        externalPriceId: input.externalPriceId,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
        currentPeriodStart: input.currentPeriodStart,
        currentPeriodEnd: input.currentPeriodEnd,
        canceledAt: input.canceledAt,
        metadata: input.metadata,
      },
    });
  }

  async createPayment(input: {
    userId: string;
    subscriptionId?: string | null;
    marketplaceOrderId?: string | null;
    provider: PaymentProvider;
    status: PaymentStatus;
    currency: string;
    amountCents: number;
    purpose: string;
    externalPaymentId?: string | null;
    externalSessionId?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    return prisma.payment.create({
      data: {
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        marketplaceOrderId: input.marketplaceOrderId,
        provider: input.provider,
        status: input.status,
        currency: input.currency,
        amountCents: input.amountCents,
        purpose: input.purpose,
        externalPaymentId: input.externalPaymentId,
        externalSessionId: input.externalSessionId,
        metadata: input.metadata,
      },
    });
  }

  async markPayment(
    externalPaymentId: string,
    data: {
      status: PaymentStatus;
      receiptUrl?: string | null;
      failureReason?: string | null;
    },
  ) {
    return prisma.payment.update({
      where: { externalPaymentId },
      data,
    });
  }

  async findPaymentBySession(externalSessionId: string) {
    return prisma.payment.findFirst({
      where: { externalSessionId },
    });
  }

  async markPaymentBySession(
    externalSessionId: string,
    data: {
      status: PaymentStatus;
      externalPaymentId?: string | null;
      receiptUrl?: string | null;
    },
  ) {
    const existing = await this.findPaymentBySession(externalSessionId);
    if (!existing) return null;
    return prisma.payment.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        externalPaymentId: data.externalPaymentId ?? undefined,
        receiptUrl: data.receiptUrl,
      },
    });
  }

  async findPaymentByExternalId(externalPaymentId: string) {
    return prisma.payment.findUnique({
      where: { externalPaymentId },
    });
  }

  async markPaymentSucceeded(
    id: string,
    data?: {
      externalPaymentId?: string | null;
      receiptUrl?: string | null;
    },
  ) {
    return prisma.payment.update({
      where: { id },
      data: {
        status: "SUCCEEDED",
        externalPaymentId: data?.externalPaymentId ?? undefined,
        receiptUrl: data?.receiptUrl,
      },
    });
  }

  async setUserPlan(userId: string, plan: Plan) {
    return prisma.user.update({
      where: { id: userId },
      data: { plan },
    });
  }
}
