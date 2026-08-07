import type { BillingProviderName } from "@/config/billing";
import { UnauthorizedError, ValidationError } from "@/domain/shared/errors";
import type { PrismaBillingRepository } from "@/infrastructure/database/repositories/billing-repository";
import type { PrismaMarketplaceRepository } from "@/infrastructure/database/repositories/marketplace-repository";
import { getStripe, isStripeConfigured } from "@/infrastructure/billing/stripe-client";
import {
  getRazorpay,
  isRazorpayKeysConfigured,
} from "@/infrastructure/billing/razorpay-client";
import { isStripeCheckoutEnabled } from "@/config/billing";
import { getPublicEnv } from "@/config/env";

export class CreateMarketplaceCheckout {
  constructor(
    private readonly marketplace: PrismaMarketplaceRepository,
    private readonly billing: PrismaBillingRepository,
  ) {}

  async execute(input: {
    buyerId: string | null | undefined;
    listingId: string;
    provider: BillingProviderName;
  }) {
    if (!input.buyerId) throw new UnauthorizedError();

    const order = await this.marketplace.createOrder({
      listingId: input.listingId,
      buyerId: input.buyerId,
      provider: input.provider,
    });

    const { appUrl } = getPublicEnv();

    if (input.provider === "STRIPE") {
      if (!isStripeCheckoutEnabled()) {
        throw new ValidationError("Stripe checkout is disabled; use Razorpay.");
      }
      if (!isStripeConfigured()) {
        throw new ValidationError("Stripe is not configured");
      }

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: order.currency.toLowerCase(),
              unit_amount: order.grossAmountCents,
              product_data: {
                name: order.listing.title,
                description: `Smitvi marketplace · 20% platform fee applied to seller payout`,
              },
            },
          },
        ],
        success_url: `${appUrl}/marketplace/orders?paid=1&order=${order.id}`,
        cancel_url: `${appUrl}/marketplace?canceled=1`,
        metadata: {
          userId: input.buyerId,
          orderId: order.id,
          purpose: "marketplace",
        },
      });

      await this.billing.createPayment({
        userId: input.buyerId,
        marketplaceOrderId: order.id,
        provider: "STRIPE",
        status: "PENDING",
        currency: order.currency,
        amountCents: order.grossAmountCents,
        purpose: "marketplace_order",
        externalSessionId: session.id,
        metadata: {
          orderId: order.id,
          commissionCents: order.commissionCents,
          netAmountCents: order.netAmountCents,
        },
      });

      return {
        provider: "STRIPE" as const,
        orderId: order.id,
        checkoutUrl: session.url,
      };
    }

    if (!isRazorpayKeysConfigured()) {
      throw new ValidationError("Razorpay is not configured");
    }

    const razorpay = getRazorpay();
    const rpOrder = await razorpay.orders.create({
      amount: order.grossAmountCents,
      currency: order.currency,
      notes: {
        orderId: order.id,
        buyerId: input.buyerId,
        purpose: "marketplace",
      },
    });

    await this.billing.createPayment({
      userId: input.buyerId,
      marketplaceOrderId: order.id,
      provider: "RAZORPAY",
      status: "PENDING",
      currency: order.currency,
      amountCents: order.grossAmountCents,
      purpose: "marketplace_order",
      externalPaymentId: String(rpOrder.id),
      metadata: {
        orderId: order.id,
        commissionCents: order.commissionCents,
        netAmountCents: order.netAmountCents,
      },
    });

    return {
      provider: "RAZORPAY" as const,
      orderId: order.id,
      razorpayOrderId: String(rpOrder.id),
      keyId: process.env.RAZORPAY_KEY_ID!,
      amountCents: order.grossAmountCents,
      currency: order.currency,
    };
  }
}
