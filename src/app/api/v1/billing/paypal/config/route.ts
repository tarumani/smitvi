import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import {
  getPayPalClientId,
  getPayPalPlanId,
  isPayPalCheckoutAvailable,
  isPayPalServerConfigured,
} from "@/config/paypal";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const url = new URL(request.url);
    const plan = url.searchParams.get("plan");
    if (plan !== "PRO" && plan !== "BUSINESS") {
      throw new ValidationError("plan must be PRO or BUSINESS");
    }
    if (!isPayPalCheckoutAvailable()) {
      throw new ValidationError("PayPal is not configured on this site.");
    }

    const planId = getPayPalPlanId(plan);
    if (!planId) {
      throw new ValidationError(`Missing PayPal plan id for ${plan}`);
    }

    return jsonOk({
      clientId: getPayPalClientId(),
      planId,
      plan,
      userId: session.user.id,
      serverReady: isPayPalServerConfigured(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
