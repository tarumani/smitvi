import { container } from "@/application/container";
import { UnauthorizedError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      throw new UnauthorizedError("Missing Razorpay signature");
    }

    const rawBody = await request.text();
    const valid = container.handleRazorpayWebhook.verify(rawBody, signature);
    if (!valid) {
      throw new UnauthorizedError("Invalid Razorpay signature");
    }

    const payload = JSON.parse(rawBody) as {
      event: string;
      payload: Record<string, unknown>;
    };

    await container.handleRazorpayWebhook.execute(
      payload as Parameters<
        typeof container.handleRazorpayWebhook.execute
      >[0],
    );

    return jsonOk({ received: true });
  } catch (error) {
    return jsonError(error);
  }
}
