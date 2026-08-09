import { describe, expect, it, vi } from "vitest";
import { resolveAuthEmailOrigin } from "./auth-email-redirect";

describe("resolveAuthEmailOrigin", () => {
  it("uses public app URL in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://smitvi.com");
    const request = new Request("http://0.0.0.0:3000/api/auth/signup");
    expect(resolveAuthEmailOrigin(request)).toBe("https://smitvi.com");
    vi.unstubAllEnvs();
  });
});
