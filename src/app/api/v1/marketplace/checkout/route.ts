import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonCreated, jsonError } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const bodySchema = z.object({
  listingId: z.string().uuid(),
  provider: z.enum(["STRIPE", "RAZORPAY"]).default("STRIPE"),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`marketplace:checkout:${session.user.id}`);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid marketplace checkout payload");
    }

    const checkout = await container.createMarketplaceCheckout.execute({
      buyerId: session.user.id,
      listingId: parsed.data.listingId,
      provider: parsed.data.provider,
    });

    return jsonCreated({ checkout });
  } catch (error) {
    return jsonError(error);
  }
}
