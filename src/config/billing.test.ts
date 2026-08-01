import { describe, expect, it } from "vitest";
import { calculateMarketplaceSplit, hasUnlimitedAi } from "@/config/billing";
import { getEntitlements } from "@/domain/billing/entitlements";

describe("calculateMarketplaceSplit", () => {
  it("applies 20% commission", () => {
    expect(calculateMarketplaceSplit(10000)).toEqual({
      commissionRate: 0.2,
      commissionCents: 2000,
      netAmountCents: 8000,
    });
  });
});

describe("hasUnlimitedAi", () => {
  it("is false for FREE and true for paid plans", () => {
    expect(hasUnlimitedAi("FREE")).toBe(false);
    expect(hasUnlimitedAi("PRO")).toBe(true);
    expect(hasUnlimitedAi("BUSINESS")).toBe(true);
  });
});

describe("getEntitlements", () => {
  it("gates company workspaces to Business", () => {
    expect(getEntitlements("FREE").businessWorkspace).toBe(false);
    expect(getEntitlements("PRO").businessWorkspace).toBe(false);
    expect(getEntitlements("BUSINESS").businessWorkspace).toBe(true);
  });

  it("gates public API and voice to paid plans", () => {
    expect(getEntitlements("FREE").publicApi).toBe(false);
    expect(getEntitlements("FREE").voiceTwin).toBe(false);
    expect(getEntitlements("PRO").publicApi).toBe(true);
    expect(getEntitlements("PRO").voiceTwin).toBe(true);
  });
});
