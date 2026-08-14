import { describe, expect, it } from "vitest";
import { incompleteProfileAutoBlockWhere } from "@/application/users/incomplete-profile-policy";
import {
  INCOMPLETE_PROFILE_BLOCK_AFTER_DAYS,
  incompleteProfileBlockCutoff,
  isIncompleteProfileEligibleToDelete,
} from "@/config/incomplete-profiles";
import { isIncompleteActivationStatus } from "@/domain/profile/activation";

describe("incomplete profile admin policy", () => {
  it("auto-pauses after 7 days from signup", () => {
    expect(INCOMPLETE_PROFILE_BLOCK_AFTER_DAYS).toBe(7);
    const now = new Date("2026-08-14T12:00:00.000Z");
    expect(incompleteProfileBlockCutoff(now).toISOString()).toBe(
      "2026-08-07T12:00:00.000Z",
    );
    expect(
      isIncompleteProfileEligibleToDelete(
        new Date("2026-08-07T12:00:00.000Z"),
        now,
      ),
    ).toBe(true);
    expect(
      isIncompleteProfileEligibleToDelete(
        new Date("2026-08-08T12:00:00.000Z"),
        now,
      ),
    ).toBe(false);
  });

  it("treats pre-activation statuses as incomplete", () => {
    expect(isIncompleteActivationStatus("REGISTERED")).toBe(true);
    expect(isIncompleteActivationStatus("PROFILE_REVIEWED")).toBe(true);
    expect(isIncompleteActivationStatus("PROFILE_ACTIVATED")).toBe(false);
    expect(isIncompleteActivationStatus(null)).toBe(true);
  });

  it("only auto-pauses unpaid non-staff accounts", () => {
    const where = incompleteProfileAutoBlockWhere();
    expect(where.plan).toBe("FREE");
    expect(where.role).toEqual({ in: ["USER", "EXPERT"] });
    expect(where.isBanned).toBe(false);
  });
});
