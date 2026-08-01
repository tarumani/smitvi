import { describe, expect, it } from "vitest";
import { assertValidOrgSlug, normalizeOrgSlug } from "@/domain/organization/slug";

describe("org slug", () => {
  it("normalizes and validates", () => {
    expect(normalizeOrgSlug(" Acme Corp ")).toBe("acme-corp");
    expect(assertValidOrgSlug("acme-team")).toBe("acme-team");
  });

  it("rejects reserved and short slugs", () => {
    expect(() => assertValidOrgSlug("new")).toThrow();
    expect(() => assertValidOrgSlug("ab")).toThrow();
  });
});
