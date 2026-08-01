import { describe, expect, it } from "vitest";
import {
  API_KEY_PREFIX,
  generateApiKeySecret,
  hashApiKey,
  looksLikeApiKey,
} from "@/domain/api-keys/token";

describe("api key token", () => {
  it("generates smv_ keys with stable hashes", () => {
    const generated = generateApiKeySecret();
    expect(generated.rawKey.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(looksLikeApiKey(generated.rawKey)).toBe(true);
    expect(hashApiKey(generated.rawKey)).toBe(generated.keyHash);
    expect(generated.keyPrefix).toBe(generated.rawKey.slice(0, 12));
  });
});
