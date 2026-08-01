import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { getPublicEnv } from "@/config/env";
import { getStripe, isStripeConfigured } from "@/infrastructure/billing/stripe-client";
import { jsonCreated, jsonError } from "@/infrastructure/http/respond";

export async function POST() {
  try {
    const session = await requireSession();
    if (!isStripeConfigured()) {
      throw new ValidationError("Stripe is not configured");
    }

    const subscription = await container.billing.getActiveSubscription(
      session.user.id,
    );
    if (!subscription?.externalCustomerId) {
      throw new ValidationError("No Stripe customer found for this account");
    }

    const { appUrl } = getPublicEnv();
    const portal = await getStripe().billingPortal.sessions.create({
      customer: subscription.externalCustomerId,
      return_url: `${appUrl}/settings/billing`,
    });

    return jsonCreated({ url: portal.url });
  } catch (error) {
    return jsonError(error);
  }
}
