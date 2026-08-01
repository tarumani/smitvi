import { describe, expect, it } from "vitest";
import {
  parseCreateProfileInput,
  parseUpdateProfileInput,
  slugifySkill,
  usernameSchema,
} from "@/domain/profile/value-objects";
import { ValidationError } from "@/domain/shared/errors";

describe("usernameSchema", () => {
  it("accepts valid usernames", () => {
    expect(usernameSchema.parse("ada.lovelace")).toBe("ada.lovelace");
    expect(usernameSchema.parse("Dev_42")).toBe("dev_42");
  });

  it("rejects invalid usernames", () => {
    expect(() => usernameSchema.parse("ab")).toThrow();
    expect(() => usernameSchema.parse("-ada")).toThrow();
    expect(() => usernameSchema.parse("ada..x")).toThrow();
  });
});

describe("parseCreateProfileInput", () => {
  it("parses a valid payload", () => {
    const result = parseCreateProfileInput({
      username: "Ada_Lovelace",
      displayName: "Ada Lovelace",
      bio: "Mathematician",
      skills: ["Mathematics", "Computing"],
    });

    expect(result.username).toBe("ada_lovelace");
    expect(result.displayName).toBe("Ada Lovelace");
    expect(result.skills).toEqual(["Mathematics", "Computing"]);
    expect(result.visibility).toBe("PUBLIC");
  });

  it("throws ValidationError for bad input", () => {
    expect(() =>
      parseCreateProfileInput({
        username: "x",
        displayName: "A",
      }),
    ).toThrow(ValidationError);
  });
});

describe("parseUpdateProfileInput", () => {
  it("allows partial updates", () => {
    const result = parseUpdateProfileInput({
      headline: "Knowledge engineer",
    });
    expect(result.headline).toBe("Knowledge engineer");
  });
});

describe("slugifySkill", () => {
  it("normalizes skill names", () => {
    expect(slugifySkill(" Machine Learning ")).toBe("machine-learning");
  });
});
