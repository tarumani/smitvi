import { createHash, randomBytes } from "node:crypto";

export const API_KEY_PREFIX = "smv_" as const;

export function generateApiKeySecret(): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const secret = randomBytes(24).toString("base64url");
  const rawKey = `${API_KEY_PREFIX}${secret}`;
  return {
    rawKey,
    keyPrefix: rawKey.slice(0, 12),
    keyHash: hashApiKey(rawKey),
  };
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function looksLikeApiKey(value: string): boolean {
  return value.startsWith(API_KEY_PREFIX) && value.length >= 20;
}
