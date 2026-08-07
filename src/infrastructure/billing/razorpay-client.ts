import Razorpay from "razorpay";
import { createHmac } from "node:crypto";
import { getRazorpayPlanId } from "@/config/billing";

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured");
  }
  if (!client) {
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return client;
}

export function isRazorpayKeysConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** Subscription checkout (requires Pro + Business plan IDs in env). */
export function isRazorpayConfigured(): boolean {
  if (!isRazorpayKeysConfigured()) return false;
  return Boolean(getRazorpayPlanId("PRO") && getRazorpayPlanId("BUSINESS"));
}

export function verifyRazorpayPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${input.orderId}|${input.paymentId}`;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return expected === input.signature;
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}
