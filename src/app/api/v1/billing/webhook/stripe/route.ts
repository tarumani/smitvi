import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return jsonError(new Error("Missing stripe-signature"));
    }

    const rawBody = await request.text();
    const event = container.handleStripeWebhook.constructEvent(
      rawBody,
      signature,
    );
    await container.handleStripeWebhook.execute(event);
    return jsonOk({ received: true });
  } catch (error) {
    return jsonError(error);
  }
}
