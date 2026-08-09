/** Block abandoned empty accounts after this many days without activity. */
export const INACTIVE_BLOCK_AFTER_DAYS = 10;

/** Permanently delete after this many days in the inactive-blocked state. */
export const INACTIVE_DELETE_AFTER_BLOCK_DAYS = 7;

/** Max accounts processed per cron run (block + delete each). */
export const INACTIVE_CLEANUP_BATCH_LIMIT = 50;

/** Touch lastLoginAt at most this often while a session is active. */
export const LAST_LOGIN_TOUCH_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Set `INACTIVE_USER_CLEANUP_ENABLED=false` to pause the cron job.
 * Defaults to enabled — only abandoned empty FREE accounts are targeted.
 */
export function isInactiveUserCleanupEnabled(): boolean {
  const raw = process.env.INACTIVE_USER_CLEANUP_ENABLED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}

export function inactiveBlockCutoff(now = new Date()): Date {
  return new Date(
    now.getTime() - INACTIVE_BLOCK_AFTER_DAYS * 24 * 60 * 60 * 1000,
  );
}

export function inactiveDeleteCutoff(now = new Date()): Date {
  return new Date(
    now.getTime() - INACTIVE_DELETE_AFTER_BLOCK_DAYS * 24 * 60 * 60 * 1000,
  );
}
