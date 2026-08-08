import { describe, expect, it } from "vitest";
import { resolveAuthEmailOrigin } from "./auth-email-redirect";

describe("resolveAuthEmailOrigin", () => {
  it("uses public app URL in production", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = "https://smitvi.com";
    const request = new Request("http://0.0.0.0:3000/api/auth/signup");
    expect(resolveAuthEmailOrigin(request)).toBe("https://smitvi.com");
    process.env.NODE_ENV = prev;
  });
});
