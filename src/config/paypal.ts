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
  // PAYPAL_CLIENT_ID is read at runtime on the server (Fly secrets). NEXT_PUBLIC_* is
  // inlined at Docker build time and stays empty if the build arg was not set.
  return (
    process.env.PAYPAL_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() ||
    ""
  );
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
