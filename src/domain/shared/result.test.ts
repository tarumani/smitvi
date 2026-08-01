import { describe, expect, it } from "vitest";
import { err, ok } from "@/domain/shared/result";

describe("Result helpers", () => {
  it("creates success values", () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it("creates failure values", () => {
    const result = err(new Error("boom"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("boom");
    }
  });
});
