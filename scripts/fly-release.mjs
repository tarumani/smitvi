/**
 * Fly release_command — apply Prisma migrations with first-deploy recovery.
 * If a prior partial migration left objects in Supabase, sync schema and baseline.
 */
import { execSync } from "node:child_process";

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

function tryRun(cmd) {
  try {
    run(cmd);
    return true;
  } catch {
    console.warn(`ignored failure: ${cmd}`);
    return false;
  }
}

// Clear failed duplicate sprint-1 migration record if present
tryRun("npx prisma migrate resolve --rolled-back 0001_sprint1_init");

try {
  run("npx prisma migrate deploy");
  console.log("Prisma migrate deploy succeeded");
} catch {
  console.warn(
    "migrate deploy failed (likely existing schema). Syncing with db push and baselining.",
  );
  run("npx prisma db push --skip-generate");
  tryRun("npx prisma migrate resolve --applied 20260801150000_init");
  console.log("Schema synced and migration baseline applied");
}
