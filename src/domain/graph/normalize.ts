/** Normalize entity names for resolution (aliases, slug matching). */
export function normalizeEntityName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\.js$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyEntityName(name: string, maxLen = 120): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
}

/** Common technology aliases → canonical slug fragment */
const TECH_ALIASES: Record<string, string> = {
  reactjs: "react",
  "react js": "react",
  "react.js": "react",
  "figma design": "figma",
};

export function resolveAliasKey(normalized: string): string {
  return TECH_ALIASES[normalized] ?? normalized.replace(/\s+/g, "-");
}
