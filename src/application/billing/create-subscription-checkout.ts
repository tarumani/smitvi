import {
  getPlanDefinition,
  getRazorpayPlanId,
  getStripePriceId,
  isStripeCheckoutEnabled,
  type BillingProviderName,
} from "@/config/billing";
import { UnauthorizedError, ValidationError } from "@/domain/shared/errors";
import type { UserPlan } from "@/domain/user/entities";
import type { PrismaBillingRepository } from "@/infrastructure/database/repositories/billing-repository";
import { getStripe, isStripeConfigured } from "@/infrastructure/billing/stripe-client";
import {
  getRazorpay,
  isRazorpayConfigured,
} from "@/infrastructure/billing/razorpay-client";
import { getPublicEnv } from "@/config/env";

export class CreateSubscriptionCheckout {
  constructor(private readonly billing: PrismaBillingRepository) {}

  async execute(input: {
    userId: string | null | undefined;
    email: string;
    plan: Exclude<UserPlan, "FREE">;
    provider: BillingProviderName;
  }) {
    if (!input.userId) throw new UnauthorizedError();

    const planDef = getPlanDefinition(input.plan);
    const { appUrl } = getPublicEnv();

    if (input.provider === "STRIPE") {
      if (!isStripeCheckoutEnabled()) {
        throw new ValidationError(
          "Stripe checkout is disabled. Use Razorpay for subscriptions.",
        );
      }
      if (!isStripeConfigured()) {
        throw new ValidationError(
          "Stripe is not configured. Set STRIPE_SECRET_KEY and price IDs.",
        );
      }
      const priceId = getStripePriceId(input.plan);
      if (!priceId) {
        throw new ValidationError(`Missing Stripe price for ${input.plan}`);
      }

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: input.email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/settings/billing?checkout=success&plan=${input.plan}`,
        cancel_url: `${appUrl}/pricing?checkout=canceled`,
        metadata: {
          userId: input.userId,
          plan: input.plan,
          purpose: "subscription",
        },
        subscription_data: {
          metadata: {
            userId: input.userId,
            plan: input.plan,
          },
        },
      });

      await this.billing.createPayment({
        userId: input.userId,
        provider: "STRIPE",
        status: "PENDING",
        currency: planDef.currency,
        amountCents: planDef.priceCentsMonthly,
        purpose: `subscription:${input.plan}`,
        externalSessionId: session.id,
        metadata: { plan: input.plan },
      });

      return {
        provider: "STRIPE" as const,
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    }

    if (!isRazorpayConfigured()) {
      throw new ValidationError(
        "Razorpay is not configured. Set RAZORPAY keys and plan IDs.",
      );
    }

    const razorpayPlanId = getRazorpayPlanId(input.plan);
    if (!razorpayPlanId) {
      throw new ValidationError(`Missing Razorpay plan for ${input.plan}`);
    }

    const razorpay = getRazorpay();
    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: 12,
      customer_notify: 1,
      notes: {
        userId: input.userId,
        plan: input.plan,
      },
    });

    await this.billing.upsertSubscription({
      userId: input.userId,
      plan: input.plan,
      provider: "RAZORPAY",
      status: "INCOMPLETE",
      externalSubscriptionId: String(subscription.id),
      metadata: { plan: input.plan },
    });

    await this.billing.createPayment({
      userId: input.userId,
      provider: "RAZORPAY",
      status: "PENDING",
      currency: planDef.currency,
      amountCents: planDef.priceCentsMonthly,
      purpose: `subscription:${input.plan}`,
      externalPaymentId: String(subscription.id),
      metadata: { plan: input.plan, kind: "razorpay_subscription" },
    });

    return {
      provider: "RAZORPAY" as const,
      subscriptionId: String(subscription.id),
      keyId: process.env.RAZORPAY_KEY_ID!,
      plan: input.plan,
      amountCents: planDef.priceCentsMonthly,
    };
  }
}
