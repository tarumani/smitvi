import { describe, expect, it } from "vitest";
import { isAdSenseAllowedPath } from "@/config/adsense";

describe("isAdSenseAllowedPath", () => {
  it("allows first-party editorial and policy pages", () => {
    expect(isAdSenseAllowedPath("/guides")).toBe(true);
    expect(
      isAdSenseAllowedPath("/guides/what-is-a-knowledge-twin"),
    ).toBe(true);
    expect(isAdSenseAllowedPath("/about")).toBe(true);
    expect(isAdSenseAllowedPath("/product/train-your-twin")).toBe(true);
    expect(isAdSenseAllowedPath("/privacy")).toBe(true);
  });

  it("blocks UGC, chat, marketplace inventory, and home", () => {
    expect(isAdSenseAllowedPath("/")).toBe(false);
    expect(isAdSenseAllowedPath("/u/maya")).toBe(false);
    expect(isAdSenseAllowedPath("/u/maya/chat")).toBe(false);
    expect(isAdSenseAllowedPath("/discover")).toBe(false);
    expect(isAdSenseAllowedPath("/marketplace")).toBe(false);
    expect(isAdSenseAllowedPath("/search")).toBe(false);
    expect(isAdSenseAllowedPath("/examples/hubs/demo")).toBe(false);
    expect(isAdSenseAllowedPath("/hub/dashboard")).toBe(false);
  });
});
