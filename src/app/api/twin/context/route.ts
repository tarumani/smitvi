import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const url = new URL(request.url);
    const ownerUserId = url.searchParams.get("ownerUserId") ?? session.user.id;
    const question = url.searchParams.get("q") ?? undefined;

    const context = await container.twinContext.getContext({
      ownerUserId,
      viewerUserId: session.user.id,
      question,
    });

    return jsonOk({ context });
  } catch (error) {
    return jsonError(error);
  }
}
