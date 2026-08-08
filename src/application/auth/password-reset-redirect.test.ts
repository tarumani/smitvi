import { describe, expect, it } from "vitest";
import { buildPasswordResetRedirectTo } from "@/application/auth/password-reset-redirect";

describe("buildPasswordResetRedirectTo", () => {
  it("uses dedicated recovery callback without query params", () => {
    expect(buildPasswordResetRedirectTo("https://smitvi.com")).toBe(
      "https://smitvi.com/auth/recovery/callback",
    );
  });
});
