import type { UserPlan } from "@/domain/user/entities";
import type { PrismaBillingRepository } from "@/infrastructure/database/repositories/billing-repository";
import type { PrismaMarketplaceRepository } from "@/infrastructure/database/repositories/marketplace-repository";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import { verifyRazorpayWebhookSignature } from "@/infrastructure/billing/razorpay-client";

type RazorpayWebhookPayload = {
  event: string;
  payload: {
    subscription?: {
      entity: {
        id: string;
        status: string;
        notes?: Record<string, string>;
      };
    };
    payment?: {
      entity: {
        id: string;
        status: string;
        order_id?: string;
        amount: number;
        currency: string;
        notes?: Record<string, string>;
      };
    };
  };
};

export class HandleRazorpayWebhook {
  constructor(
    private readonly billing: PrismaBillingRepository,
    private readonly marketplace: PrismaMarketplaceRepository,
    private readonly auditLogs = new PrismaAuditLogRepository(),
  ) {}

  verify(rawBody: string, signature: string): boolean {
    return verifyRazorpayWebhookSignature(rawBody, signature);
  }

  async execute(payload: RazorpayWebhookPayload) {
    if (payload.event.startsWith("subscription.")) {
      await this.onSubscription(payload);
      return;
    }

    if (payload.event === "payment.captured") {
      await this.onPaymentCaptured(payload);
    }
  }

  private async onSubscription(payload: RazorpayWebhookPayload) {
    const entity = payload.payload.subscription?.entity;
    if (!entity) return;

    const userId = entity.notes?.userId;
    const plan = entity.notes?.plan as UserPlan | undefined;
    if (!userId || (plan !== "PRO" && plan !== "BUSINESS")) return;

    const status =
      entity.status === "active"
        ? "ACTIVE"
        : entity.status === "cancelled" || entity.status === "canceled"
          ? "CANCELED"
          : "INCOMPLETE";

    await this.billing.upsertSubscription({
      userId,
      plan,
      provider: "RAZORPAY",
      status,
      externalSubscriptionId: entity.id,
    });

    if (status === "ACTIVE") {
      await this.billing.setUserPlan(userId, plan);
      await this.auditLogs.create({
        actorId: userId,
        action: "SUBSCRIPTION_STARTED",
        entityType: "subscription",
        entityId: entity.id,
        metadata: { provider: "RAZORPAY", plan },
      });
    }

    if (status === "CANCELED") {
      await this.billing.setUserPlan(userId, "FREE");
      await this.auditLogs.create({
        actorId: userId,
        action: "SUBSCRIPTION_CANCELED",
        entityType: "subscription",
        entityId: entity.id,
        metadata: { provider: "RAZORPAY" },
      });
    }
  }

  private async onPaymentCaptured(payload: RazorpayWebhookPayload) {
    const payment = payload.payload.payment?.entity;
    if (!payment || payment.status !== "captured") return;

    // Checkout stores the Razorpay order id as externalPaymentId.
    const pending =
      (payment.order_id
        ? await this.billing.findPaymentByExternalId(payment.order_id)
        : null) ??
      (await this.billing.findPaymentByExternalId(payment.id));

    const orderId =
      payment.notes?.orderId ??
      (pending?.metadata &&
      typeof pending.metadata === "object" &&
      pending.metadata !== null &&
      "orderId" in pending.metadata &&
      typeof (pending.metadata as { orderId?: unknown }).orderId === "string"
        ? (pending.metadata as { orderId: string }).orderId
        : null);
    const buyerId = payment.notes?.buyerId ?? pending?.userId;
    if (!orderId || !buyerId) return;

    await this.marketplace.markOrderPaid(orderId);

    if (pending) {
      await this.billing.markPaymentSucceeded(pending.id, {
        externalPaymentId: payment.id,
      });
    }

    await this.auditLogs.create({
      actorId: buyerId,
      action: "MARKETPLACE_ORDER_PAID",
      entityType: "marketplace_order",
      entityId: orderId,
      metadata: { provider: "RAZORPAY" },
    });
  }
}
