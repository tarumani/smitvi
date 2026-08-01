import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonCreated, jsonError } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const bodySchema = z.object({
  plan: z.enum(["PRO", "BUSINESS"]),
  provider: z.enum(["STRIPE", "RAZORPAY"]).default("STRIPE"),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`billing:checkout:${session.user.id}`);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid checkout payload");
    }

    const checkout = await container.createSubscriptionCheckout.execute({
      userId: session.user.id,
      email: session.email,
      plan: parsed.data.plan,
      provider: parsed.data.provider,
    });

    return jsonCreated({ checkout });
  } catch (error) {
    return jsonError(error);
  }
}
