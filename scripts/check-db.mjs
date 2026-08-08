/**
 * Prints which local DB endpoints respond (5432 Docker, 51218 Prisma dev).
 * Run: node scripts/check-db.mjs
 */
import net from "node:net";

function probe(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    socket.setTimeout(2000);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

const docker = await probe("127.0.0.1", 5432);
const prismaDev = await probe("127.0.0.1", 51218);

console.log("Database reachability:");
console.log(`  127.0.0.1:5432  (Docker npm run db:local): ${docker ? "UP" : "down"}`);
console.log(`  127.0.0.1:51218 (Prisma dev):              ${prismaDev ? "UP" : "down"}`);

if (!docker && !prismaDev) {
  console.log("");
  console.log("No local Postgres is running. Options:");
  console.log("  1) Install Docker Desktop, then: npm run db:local");
  console.log("     Set DATABASE_URL/DIRECT_URL to 127.0.0.1:5432 in .env (see README)");
  console.log("  2) Use Supabase DIRECT_URL in .env (already configured for remote dev)");
  console.log("  3) Fix npm TLS and run: npx prisma dev --name smitvi --detach");
  process.exit(1);
}
