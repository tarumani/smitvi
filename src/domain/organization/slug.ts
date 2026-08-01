import { ValidationError } from "@/domain/shared/errors";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

export function normalizeOrgSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-");
}

export function assertValidOrgSlug(slug: string): string {
  const normalized = normalizeOrgSlug(slug);
  if (!SLUG_RE.test(normalized) || normalized.length < 3 || normalized.length > 40) {
    throw new ValidationError(
      "Organization slug must be 3–40 chars: lowercase letters, numbers, hyphens",
    );
  }
  const reserved = new Set([
    "new",
    "invite",
    "settings",
    "admin",
    "api",
    "smitvi",
  ]);
  if (reserved.has(normalized)) {
    throw new ValidationError("That organization slug is reserved");
  }
  return normalized;
}
