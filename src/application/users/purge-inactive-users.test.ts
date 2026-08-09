import { describe, expect, it } from "vitest";
import {
  INACTIVE_BLOCK_AFTER_DAYS,
  INACTIVE_DELETE_AFTER_BLOCK_DAYS,
  inactiveBlockCutoff,
  inactiveDeleteCutoff,
} from "@/config/inactive-users";
import { abandonedEmptyAccountWhere } from "@/application/users/purge-inactive-users";

describe("inactive user cleanup policy", () => {
  it("uses a 10-day block window and 7-day delete grace", () => {
    expect(INACTIVE_BLOCK_AFTER_DAYS).toBe(10);
    expect(INACTIVE_DELETE_AFTER_BLOCK_DAYS).toBe(7);

    const now = new Date("2026-08-20T12:00:00.000Z");
    expect(inactiveBlockCutoff(now).toISOString()).toBe(
      "2026-08-10T12:00:00.000Z",
    );
    expect(inactiveDeleteCutoff(now).toISOString()).toBe(
      "2026-08-13T12:00:00.000Z",
    );
  });

  it("only targets abandoned empty FREE accounts", () => {
    const where = abandonedEmptyAccountWhere();
    expect(where.plan).toBe("FREE");
    expect(where.role).toEqual({ in: ["USER", "EXPERT"] });
    expect(where.isBanned).toBe(false);
    expect(where.knowledgeSources).toEqual({ none: {} });
    expect(where.marketplaceListings).toEqual({ none: {} });
    expect(where.ownedOrganizations).toEqual({ none: {} });
  });
});
