import type { UserPlan } from "@/domain/user/entities";

export type PayPalMode = "live" | "sandbox";

export function getPayPalApiBase(): string {
  return getPayPalMode() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function getPayPalMode(): PayPalMode {
  const mode = process.env.PAYPAL_MODE?.trim().toLowerCase();
  return mode === "sandbox" ? "sandbox" : "live";
}

export function getPayPalClientId(): string {
  return process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() ?? "";
}

export function getPayPalPlanId(plan: Exclude<UserPlan, "FREE">): string | null {
  if (plan === "PRO") {
    return process.env.PAYPAL_PLAN_PRO?.trim() || null;
  }
  return process.env.PAYPAL_PLAN_BUSINESS?.trim() || null;
}

export function isPayPalServerConfigured(): boolean {
  return Boolean(
    getPayPalClientId() &&
      process.env.PAYPAL_CLIENT_SECRET?.trim() &&
      getPayPalPlanId("PRO") &&
      getPayPalPlanId("BUSINESS"),
  );
}

export function isPayPalCheckoutAvailable(): boolean {
  return Boolean(
    getPayPalClientId() && getPayPalPlanId("PRO") && getPayPalPlanId("BUSINESS"),
  );
}
