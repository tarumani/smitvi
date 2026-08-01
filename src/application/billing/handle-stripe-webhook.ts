import type Stripe from "stripe";
import type { UserPlan } from "@/domain/user/entities";
import type { PrismaBillingRepository } from "@/infrastructure/database/repositories/billing-repository";
import type { PrismaMarketplaceRepository } from "@/infrastructure/database/repositories/marketplace-repository";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import { getStripe } from "@/infrastructure/billing/stripe-client";

function planFromMetadata(value: string | null | undefined): UserPlan | null {
  if (value === "PRO" || value === "BUSINESS") return value;
  return null;
}

export class HandleStripeWebhook {
  constructor(
    private readonly billing: PrismaBillingRepository,
    private readonly marketplace: PrismaMarketplaceRepository,
    private readonly auditLogs = new PrismaAuditLogRepository(),
  ) {}

  constructEvent(rawBody: string, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }
    return getStripe().webhooks.constructEvent(rawBody, signature, secret);
  }

  async execute(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.onCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await this.onSubscriptionChanged(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await this.onSubscriptionDeleted(subscription);
        break;
      }
      default:
        break;
    }
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    if (session.mode === "subscription") {
      const plan = planFromMetadata(session.metadata?.plan);
      if (!plan) return;

      await this.billing.setUserPlan(userId, plan);
      if (typeof session.subscription === "string") {
        await this.billing.upsertSubscription({
          userId,
          plan,
          provider: "STRIPE",
          status: "ACTIVE",
          externalCustomerId:
            typeof session.customer === "string" ? session.customer : null,
          externalSubscriptionId: session.subscription,
        });
      }

      await this.auditLogs.create({
        actorId: userId,
        action: "SUBSCRIPTION_STARTED",
        entityType: "subscription",
        entityId: userId,
        metadata: { plan, provider: "STRIPE" },
      });
      return;
    }

    if (session.mode === "payment" && session.metadata?.orderId) {
      await this.marketplace.markOrderPaid(session.metadata.orderId);
      const existing = await this.billing.findPaymentBySession(session.id);
      if (
        existing?.externalPaymentId == null &&
        session.payment_intent &&
        typeof session.payment_intent === "string"
      ) {
        await this.billing.markPaymentBySession(session.id, {
          status: "SUCCEEDED",
          externalPaymentId: session.payment_intent,
        });
      }
      await this.auditLogs.create({
        actorId: userId,
        action: "MARKETPLACE_ORDER_PAID",
        entityType: "marketplace_order",
        entityId: session.metadata.orderId,
        metadata: { provider: "STRIPE" },
      });
    }
  }

  private async onSubscriptionChanged(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    const plan = planFromMetadata(subscription.metadata.plan);
    if (!userId || !plan) return;

    const status = mapStripeStatus(subscription.status);
    // Stripe API 2025+ exposes billing period on subscription items.
    const periodItem = subscription.items.data[0];
    await this.billing.upsertSubscription({
      userId,
      plan,
      provider: "STRIPE",
      status,
      externalCustomerId:
        typeof subscription.customer === "string" ? subscription.customer : null,
      externalSubscriptionId: subscription.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: periodItem
        ? new Date(periodItem.current_period_start * 1000)
        : null,
      currentPeriodEnd: periodItem
        ? new Date(periodItem.current_period_end * 1000)
        : null,
    });

    if (status === "ACTIVE" || status === "TRIALING") {
      await this.billing.setUserPlan(userId, plan);
    }
    if (status === "CANCELED" || status === "UNPAID") {
      await this.billing.setUserPlan(userId, "FREE");
    }

    await this.auditLogs.create({
      actorId: userId,
      action: "SUBSCRIPTION_UPDATED",
      entityType: "subscription",
      entityId: subscription.id,
      metadata: { status, plan },
    });
  }

  private async onSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await this.billing.upsertSubscription({
      userId,
      plan: "FREE",
      provider: "STRIPE",
      status: "CANCELED",
      externalSubscriptionId: subscription.id,
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
    });
    await this.billing.setUserPlan(userId, "FREE");
    await this.auditLogs.create({
      actorId: userId,
      action: "SUBSCRIPTION_CANCELED",
      entityType: "subscription",
      entityId: subscription.id,
    });
  }
}

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "UNPAID" {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "unpaid":
      return "UNPAID";
    default:
      return "INCOMPLETE";
  }
}
