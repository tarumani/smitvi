/** Auto-pause incomplete profiles after this many calendar days from signup. */
export const INCOMPLETE_PROFILE_BLOCK_AFTER_DAYS = 7;

export function incompleteProfileBlockCutoff(now = new Date()): Date {
  return new Date(
    now.getTime() -
      INCOMPLETE_PROFILE_BLOCK_AFTER_DAYS * 24 * 60 * 60 * 1000,
  );
}

export function incompleteProfileEligibleAt(createdAt: Date): Date {
  return new Date(
    createdAt.getTime() +
      INCOMPLETE_PROFILE_BLOCK_AFTER_DAYS * 24 * 60 * 60 * 1000,
  );
}

export function daysSince(date: Date, now = new Date()): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000)),
  );
}

export function isIncompleteProfileEligibleToDelete(
  createdAt: Date,
  now = new Date(),
): boolean {
  return createdAt.getTime() <= incompleteProfileBlockCutoff(now).getTime();
}
