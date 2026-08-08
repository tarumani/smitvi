import { describe, expect, it } from "vitest";
import { recommendationCache } from "@/infrastructure/recommendations/recommendation-cache";

const GAP_CATALOG = [
  {
    name: "Accessibility",
    triggers: ["ux", "ui", "design", "figma"],
  },
  {
    name: "React basics",
    triggers: ["design", "figma", "ux"],
  },
] as const;

function detectGaps(haveNames: string[]) {
  const have = new Set(haveNames.map((n) => n.toLowerCase()));
  const blob = [...have].join(" ");
  const gaps: string[] = [];
  for (const item of GAP_CATALOG) {
    if (have.has(item.name.toLowerCase())) continue;
    if (item.triggers.some((t) => blob.includes(t))) gaps.push(item.name);
  }
  return gaps;
}

function opportunityScore(
  entityValues: string[],
  listingText: string,
): number {
  const text = listingText.toLowerCase();
  const matched = entityValues.filter((v) => text.includes(v.toLowerCase()));
  return entityValues.length === 0
    ? 50
    : Math.round((matched.length / Math.max(entityValues.length, 1)) * 100);
}

describe("learning gap triggers", () => {
  it("suggests accessibility for UX + Figma profile", () => {
    const gaps = detectGaps(["UI Design", "Figma", "Healthcare"]);
    expect(gaps).toContain("Accessibility");
  });

  it("skips gaps user already has", () => {
    const gaps = detectGaps(["Accessibility", "Figma"]);
    expect(gaps).not.toContain("Accessibility");
  });
});

describe("opportunity matching score", () => {
  it("scores high when listing mentions graph skills", () => {
    const score = opportunityScore(
      ["UX Design", "Healthcare", "Figma"],
      "Healthcare UX designer needed — Figma and mobile apps",
    );
    expect(score).toBeGreaterThanOrEqual(66);
  });

  it("scores low when no overlap", () => {
    const score = opportunityScore(
      ["UX Design", "Healthcare"],
      "Rust blockchain backend engineer",
    );
    expect(score).toBeLessThan(40);
  });
});

describe("recommendationCache", () => {
  it("returns cached bundle until invalidated", () => {
    recommendationCache.set("user-test", { experts: [] });
    expect(recommendationCache.get("user-test")).toEqual({ experts: [] });
    recommendationCache.invalidate("user-test");
    expect(recommendationCache.get("user-test")).toBeNull();
  });
});

describe("recommendation id format", () => {
  it("parses kind and target from composite id", () => {
    const id = "expert:abc-user-id";
    const idx = id.indexOf(":");
    const kind = idx === -1 ? "expert" : id.slice(0, idx);
    const target = idx === -1 ? id : id.slice(idx + 1);
    expect(kind).toBe("expert");
    expect(target).toBe("abc-user-id");
  });
});
