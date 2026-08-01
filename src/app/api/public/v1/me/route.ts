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
    const auth = await requireApiKey(request, "twin:ask");
    const profile = await container.profiles.findSummaryByUserId(auth.userId);
    return withPublicApiCors(
      jsonOk({
        userId: auth.userId,
        email: auth.email,
        plan: auth.plan,
        username: profile?.username ?? null,
        displayName: profile?.displayName ?? null,
        scopes: auth.scopes,
      }),
    );
  } catch (error) {
    return withPublicApiCors(jsonError(error));
  }
}
