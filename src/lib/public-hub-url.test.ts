import { describe, expect, it } from "vitest";
import { publicHubRewritePath } from "@/lib/public-hub-url";

describe("publicHubRewritePath", () => {
  it("maps /@username onto /u/username", () => {
    expect(publicHubRewritePath("/@heilwesen")).toBe("/u/heilwesen");
    expect(publicHubRewritePath("/@heilwesen/chat")).toBe("/u/heilwesen/chat");
  });

  it("decodes %40 from first-click links", () => {
    expect(publicHubRewritePath("/%40heilwesen")).toBe("/u/heilwesen");
    expect(publicHubRewritePath("/%40heilwesen/store")).toBe(
      "/u/heilwesen/store",
    );
  });

  it("ignores unrelated paths", () => {
    expect(publicHubRewritePath("/u/heilwesen")).toBeNull();
    expect(publicHubRewritePath("/@")).toBeNull();
    expect(publicHubRewritePath("/hub/dashboard")).toBeNull();
  });
});
