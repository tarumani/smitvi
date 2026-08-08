import { describe, expect, it } from "vitest";
import { getPayPalPlanId } from "@/config/paypal";

describe("getPayPalPlanId", () => {
  it("reads plan ids from env", () => {
    process.env.PAYPAL_PLAN_PRO = "P-pro";
    process.env.PAYPAL_PLAN_BUSINESS = "P-biz";
    expect(getPayPalPlanId("PRO")).toBe("P-pro");
    expect(getPayPalPlanId("BUSINESS")).toBe("P-biz");
  });
});
