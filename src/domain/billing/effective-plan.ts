import type { UserPlan } from "@/domain/user/entities";

/** Comma-separated emails in BUSINESS_TEST_EMAILS get Business entitlements (testing/admin). */
export function resolveEffectiveUserPlan(
  plan: UserPlan,
  email: string,
): UserPlan {
  const grants = (process.env.BUSINESS_TEST_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (grants.includes(email.trim().toLowerCase())) {
    return "BUSINESS";
  }
  return plan;
}
