import { ValidationError } from "@/domain/shared/errors";
import { prisma } from "@/infrastructure/database/prisma";
import { getStripe, isStripeConfigured } from "@/infrastructure/billing/stripe-client";
import {
  getRazorpay,
  isRazorpayKeysConfigured,
} from "@/infrastructure/billing/razorpay-client";

export type ProviderRefundResult = {
  provider: "STRIPE" | "RAZORPAY" | "NONE";
  externalRefundId: string | null;
  skipped: boolean;
  skipReason?: string;
};

/**
 * Issue a full refund at Stripe/Razorpay for a marketplace order payment.
 * Idempotent when the same marketplace refund id is reused.
 */
export class ProviderPaymentRefundService {
  async refundMarketplaceOrder(input: {
    orderId: string;
    refundId: string;
    amountCents: number;
    currency: string;
    reason?: string | null;
  }): Promise<ProviderRefundResult> {
    const payment = await prisma.payment.findFirst({
      where: { marketplaceOrderId: input.orderId },
      orderBy: { createdAt: "desc" },
    });

    if (!payment) {
      return {
        provider: "NONE",
        externalRefundId: null,
        skipped: true,
        skipReason: "No payment row for order",
      };
    }

    if (payment.status === "REFUNDED") {
      const meta = asMeta(payment.metadata);
      return {
        provider: payment.provider === "STRIPE" ? "STRIPE" : "RAZORPAY",
        externalRefundId:
          typeof meta.providerRefundId === "string"
            ? meta.providerRefundId
            : payment.externalPaymentId,
        skipped: true,
        skipReason: "Payment already marked REFUNDED",
      };
    }

    if (payment.provider === "STRIPE") {
      return this.refundStripe(payment, input);
    }

    if (payment.provider === "RAZORPAY") {
      return this.refundRazorpay(payment, input);
    }

    return {
      provider: "NONE",
      externalRefundId: null,
      skipped: true,
      skipReason: `Unsupported provider ${payment.provider}`,
    };
  }

  private async refundStripe(
    payment: {
      id: string;
      externalPaymentId: string | null;
      externalSessionId: string | null;
      amountCents: number;
      metadata: unknown;
    },
    input: {
      refundId: string;
      amountCents: number;
      reason?: string | null;
    },
  ): Promise<ProviderRefundResult> {
    if (!isStripeConfigured() && !process.env.STRIPE_SECRET_KEY) {
      throw new ValidationError("Stripe is not configured for refunds");
    }

    const stripe = getStripe();
    let paymentIntentId = payment.externalPaymentId;

    if (!paymentIntentId?.startsWith("pi_") && payment.externalSessionId) {
      const session = await stripe.checkout.sessions.retrieve(
        payment.externalSessionId,
      );
      if (typeof session.payment_intent === "string") {
        paymentIntentId = session.payment_intent;
      }
    }

    if (!paymentIntentId?.startsWith("pi_")) {
      throw new ValidationError(
        "Stripe payment_intent missing on payment — cannot refund",
      );
    }

    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        amount: input.amountCents,
        reason: "requested_by_customer",
        metadata: {
          marketplaceRefundId: input.refundId,
        },
      },
      { idempotencyKey: `marketplace-refund-${input.refundId}` },
    );

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalPaymentId: paymentIntentId,
        metadata: {
          ...asMeta(payment.metadata),
          providerRefundId: refund.id,
          providerRefundStatus: refund.status,
        },
      },
    });

    return {
      provider: "STRIPE",
      externalRefundId: refund.id,
      skipped: false,
    };
  }

  private async refundRazorpay(
    payment: {
      id: string;
      externalPaymentId: string | null;
      amountCents: number;
      metadata: unknown;
    },
    input: {
      refundId: string;
      amountCents: number;
      reason?: string | null;
    },
  ): Promise<ProviderRefundResult> {
    if (!isRazorpayKeysConfigured()) {
      throw new ValidationError("Razorpay is not configured for refunds");
    }

    const razorpay = getRazorpay();
    let paymentId = payment.externalPaymentId;

    // Checkout initially stores order_*; webhook should replace with pay_*.
    if (paymentId?.startsWith("order_")) {
      const orderPayments = await razorpay.orders.fetchPayments(paymentId);
      const items = (orderPayments as { items?: Array<{ id: string; status: string }> })
        .items;
      const captured =
        items?.find((p) => p.status === "captured") ?? items?.[0];
      if (!captured?.id) {
        throw new ValidationError(
          "Razorpay payment id not found for order — cannot refund",
        );
      }
      paymentId = captured.id;
    }

    if (!paymentId?.startsWith("pay_")) {
      throw new ValidationError(
        "Razorpay payment id missing — cannot refund",
      );
    }

    // Idempotency: if a prior refund exists for this marketplace refund id, reuse it
    try {
      const existing = await razorpay.payments.fetch(paymentId);
      const refunds = (
        existing as {
          refunds?: { items?: Array<{ id: string; notes?: Record<string, string> }> };
        }
      ).refunds?.items;
      const prior = refunds?.find(
        (r) => r.notes?.marketplaceRefundId === input.refundId,
      );
      if (prior?.id) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            externalPaymentId: paymentId,
            metadata: {
              ...asMeta(payment.metadata),
              providerRefundId: prior.id,
            },
          },
        });
        return {
          provider: "RAZORPAY",
          externalRefundId: prior.id,
          skipped: true,
          skipReason: "Razorpay refund already exists",
        };
      }
    } catch {
      /* fetch optional */
    }

    const refund = (await razorpay.payments.refund(paymentId, {
      amount: input.amountCents,
      notes: {
        marketplaceRefundId: input.refundId,
        reason: (input.reason ?? "marketplace_refund").slice(0, 100),
      },
    })) as { id: string };

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalPaymentId: paymentId,
        metadata: {
          ...asMeta(payment.metadata),
          providerRefundId: refund.id,
        },
      },
    });

    return {
      provider: "RAZORPAY",
      externalRefundId: refund.id,
      skipped: false,
    };
  }
}

function asMeta(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}
