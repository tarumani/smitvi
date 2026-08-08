import "dotenv/config";
import { BackfillUserGraphs } from "@/application/graph/backfill-user-graphs";
import { GraphService } from "@/application/graph/graph-service";
import { SyncProfileToGraph } from "@/application/graph/sync-profile-to-graph";
import { PrismaGraphRepository } from "@/infrastructure/database/repositories/graph-repository";

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

  const repo = new PrismaGraphRepository();
  const graph = new GraphService(repo);
  const sync = new SyncProfileToGraph(graph, repo);
  const backfill = new BackfillUserGraphs(repo, sync, graph);

  console.log("[graph:backfill] Starting idempotent profile → graph sync…");

  const results = await backfill.executeAll({
    limit: Number.isFinite(limit) ? limit : undefined,
    onProgress: (p) => {
      if (p.ok) {
        console.log(
          `[graph:backfill] OK ${p.userId} (+${p.relationshipsCreated ?? 0} edges)`,
        );
      } else {
        console.error(`[graph:backfill] FAIL ${p.userId}: ${p.error}`);
      }
    },
  });

  const ok = results.filter((r) => r.ok).length;
  console.log(
    `[graph:backfill] Done. ${ok}/${results.length} users synced successfully.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
