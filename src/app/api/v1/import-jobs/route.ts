import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonCreated, jsonError } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`import-job:${session.user.id}`);
    const body: unknown = await request.json();
    const job = await container.createImportJob.execute(session.user.id, body);
    return jsonCreated({ job });
  } catch (error) {
    return jsonError(error);
  }
}
