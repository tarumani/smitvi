import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { isPayPalServerConfigured } from "@/config/paypal";
import { ValidationError } from "@/domain/shared/errors";
import { jsonCreated, jsonError } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const bodySchema = z.object({
  plan: z.enum(["PRO", "BUSINESS"]),
  subscriptionId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`billing:paypal:${session.user.id}`);

    if (!isPayPalServerConfigured()) {
      throw new ValidationError(
        "PayPal server credentials are missing. Set PAYPAL_CLIENT_SECRET on the server.",
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid PayPal confirmation payload");
    }

    const result = await container.activatePayPalSubscription.execute({
      userId: session.user.id,
      plan: parsed.data.plan,
      subscriptionId: parsed.data.subscriptionId,
    });

    return jsonCreated(result);
  } catch (error) {
    return jsonError(error);
  }
}
