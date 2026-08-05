import { afterEach, describe, expect, it } from "vitest";
import { getRequestOrigin } from "./request-origin";

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (originalAppUrl === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  }
});

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { headers });
}

describe("getRequestOrigin", () => {
  it("prefers x-forwarded-host over 0.0.0.0 request urls", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://smitvi.com";
    const origin = getRequestOrigin(
      makeRequest("http://0.0.0.0:3000/auth/callback", {
        "x-forwarded-host": "smitvi.com",
        "x-forwarded-proto": "https",
        host: "0.0.0.0:3000",
      }),
    );
    expect(origin).toBe("https://smitvi.com");
  });

  it("falls back to NEXT_PUBLIC_APP_URL when host is unusable", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://smitvi.com";
    const origin = getRequestOrigin(
      makeRequest("http://0.0.0.0:3000/login", {
        host: "0.0.0.0:3000",
      }),
    );
    expect(origin).toBe("https://smitvi.com");
  });

  it("uses a valid Host header when forwarded headers are missing", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://smitvi.com";
    const origin = getRequestOrigin(
      makeRequest("http://127.0.0.1:3000/login", {
        host: "localhost:3000",
      }),
    );
    expect(origin).toBe("http://localhost:3000");
  });
});
