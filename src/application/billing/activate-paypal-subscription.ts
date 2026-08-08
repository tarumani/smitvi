import type { UserPlan } from "@/domain/user/entities";
import { ValidationError } from "@/domain/shared/errors";
import { getPayPalPlanId } from "@/config/paypal";
import type { PrismaBillingRepository } from "@/infrastructure/database/repositories/billing-repository";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import { fetchPayPalSubscription } from "@/infrastructure/billing/paypal-client";

const ACTIVE_STATUSES = new Set(["ACTIVE", "APPROVED"]);

export class ActivatePayPalSubscription {
  constructor(
    private readonly billing: PrismaBillingRepository,
    private readonly auditLogs = new PrismaAuditLogRepository(),
  ) {}

  async execute(input: {
    userId: string;
    plan: Exclude<UserPlan, "FREE">;
    subscriptionId: string;
  }) {
    const expectedPlanId = getPayPalPlanId(input.plan);
    if (!expectedPlanId) {
      throw new ValidationError(`PayPal plan not configured for ${input.plan}`);
    }

    const subscription = await fetchPayPalSubscription(input.subscriptionId.trim());
    const status = subscription.status?.toUpperCase() ?? "";
    if (!ACTIVE_STATUSES.has(status)) {
      throw new ValidationError(
        `PayPal subscription is not active yet (status: ${status || "unknown"}).`,
      );
    }

    if (subscription.plan_id !== expectedPlanId) {
      throw new ValidationError("PayPal plan does not match the selected Smitvi plan.");
    }

    if (subscription.custom_id && subscription.custom_id !== input.userId) {
      throw new ValidationError("PayPal subscription is linked to a different account.");
    }

    await this.billing.upsertSubscription({
      userId: input.userId,
      plan: input.plan,
      provider: "PAYPAL",
      status: "ACTIVE",
      externalSubscriptionId: input.subscriptionId,
      externalPriceId: subscription.plan_id ?? expectedPlanId,
      metadata: { plan: input.plan, provider: "PAYPAL" },
    });

    await this.billing.setUserPlan(input.userId, input.plan);

    await this.auditLogs.create({
      actorId: input.userId,
      action: "SUBSCRIPTION_STARTED",
      entityType: "subscription",
      entityId: input.subscriptionId,
      metadata: { provider: "PAYPAL", plan: input.plan },
    });

    return { plan: input.plan, subscriptionId: input.subscriptionId };
  }
}
