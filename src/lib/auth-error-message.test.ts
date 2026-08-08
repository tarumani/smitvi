import { describe, expect, it } from "vitest";
import { formatAuthErrorMessage } from "./auth-error-message";

describe("formatAuthErrorMessage", () => {
  it("replaces empty Supabase bodies shown as {}", () => {
    const message = formatAuthErrorMessage(
      { message: "{}" },
      "Could not send reset email",
      "reset-email",
    );
    expect(message).not.toBe("{}");
    expect(message).toContain("SMTP");
  });
});
