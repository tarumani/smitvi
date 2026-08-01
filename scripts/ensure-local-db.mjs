import { Client } from "pg";

const adminUrl =
  "postgres://postgres:postgres@localhost:51218/template1?sslmode=disable";

const client = new Client({ connectionString: adminUrl });
await client.connect();

const existing = await client.query(
  "SELECT 1 FROM pg_database WHERE datname = $1",
  ["smitvi"],
);

if (existing.rowCount === 0) {
  await client.query("CREATE DATABASE smitvi");
  console.log("created database: smitvi");
} else {
  console.log("database already exists: smitvi");
}

await client.end();
