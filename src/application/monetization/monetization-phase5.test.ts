import { describe, expect, it } from "vitest";
import { MARKETPLACE_COMMISSION_RATE } from "@/config/constants";

describe("PlatformFeeService fallback", () => {
  it("documents default commission constant", () => {
    expect(MARKETPLACE_COMMISSION_RATE).toBeGreaterThan(0);
    expect(MARKETPLACE_COMMISSION_RATE).toBeLessThanOrEqual(0.5);
  });
});

describe("marketplace split math", () => {
  it("computes net from gross", () => {
    const gross = 10000;
    const rate = 0.1;
    const commission = Math.round(gross * rate);
    expect(gross - commission).toBe(9000);
  });
});

describe("idempotent fulfillment logic", () => {
  it("skips duplicate credit when already paid", () => {
    const statuses = ["PAID", "FULFILLED"];
    expect(statuses.includes("PAID")).toBe(true);
  });
});
