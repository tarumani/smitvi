import type { PaymentProvider } from "@/generated/prisma/client";

/** Provider abstraction — implemented by existing Stripe/Razorpay checkout flows. */
export interface PaymentProviderPort {
  readonly name: PaymentProvider;
  createCheckout(input: unknown): Promise<{ url: string }>;
  verifyWebhook(rawBody: string, signature: string): unknown;
}

export type PaymentState =
  | "CREATED"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED"
  | "DISPUTED";
