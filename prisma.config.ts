import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

config({ path: resolve(import.meta.dirname, ".env") });

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const isMigrate = process.argv.some((arg) => arg.includes("migrate"));
if (!url && isMigrate) {
  throw new Error(
    "Set DATABASE_URL or DIRECT_URL in smitvi/.env. Uncomment the Supabase or local Postgres block, then retry: npx prisma migrate deploy",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: url ?? "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
  },
});
