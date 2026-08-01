import { requireApiKey } from "@/application/api/require-api-key";
import { container } from "@/application/container";
import {
  publicApiOptionsResponse,
  withPublicApiCors,
} from "@/infrastructure/http/cors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function OPTIONS() {
  return publicApiOptionsResponse();
}

export async function GET(request: Request) {
  try {
    const auth = await requireApiKey(request, "knowledge:read");
    const sources = await container.knowledge.listByUser(auth.userId);
    return withPublicApiCors(
      jsonOk({
        sources: sources.map((source) => ({
          id: source.id,
          title: source.title,
          type: source.type,
          status: source.status,
          summary: source.summary,
          tags: source.tags,
          topics: source.topics,
          chunkCount: source.chunkCount,
          isPublic: source.isPublic,
          createdAt: source.createdAt,
          updatedAt: source.updatedAt,
        })),
      }),
    );
  } catch (error) {
    return withPublicApiCors(jsonError(error));
  }
}
