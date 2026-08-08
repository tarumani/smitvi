import { describe, expect, it } from "vitest";
import {
  normalizeEntityName,
  resolveAliasKey,
  slugifyEntityName,
} from "@/domain/graph/normalize";

describe("normalizeEntityName", () => {
  it("normalizes react.js variants", () => {
    expect(normalizeEntityName("React.js")).toBe("react");
    expect(normalizeEntityName("ReactJS")).toBe("reactjs");
  });

  it("slugifies consistently", () => {
    expect(slugifyEntityName("Figma Design")).toBe("figma-design");
  });

  it("resolves technology aliases", () => {
    expect(resolveAliasKey("react js")).toBe("react");
    expect(resolveAliasKey("figma design")).toBe("figma");
  });
});

describe("duplicate prevention keys", () => {
  it("uses same slug for skill variants", () => {
    const a = slugifyEntityName("Machine Learning");
    const b = slugifyEntityName("machine learning");
    expect(a).toBe(b);
  });
});
