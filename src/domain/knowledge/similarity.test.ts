import { describe, expect, it } from "vitest";
import { averageScore, cosineSimilarity } from "@/domain/knowledge/similarity";
import { chunkText } from "@/domain/knowledge/chunking";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
});

describe("averageScore", () => {
  it("averages scores", () => {
    expect(averageScore([0.2, 0.4, 0.6])).toBeCloseTo(0.4);
  });
});

describe("chunkText", () => {
  it("returns single chunk for short text", () => {
    expect(chunkText("Hello world")).toEqual(["Hello world"]);
  });

  it("splits long text", () => {
    const text = "word ".repeat(500);
    const chunks = chunkText(text, 200, 40);
    expect(chunks.length).toBeGreaterThan(1);
  });
});
