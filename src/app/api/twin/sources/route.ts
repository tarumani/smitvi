import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const url = new URL(request.url);
    const ownerUserId = url.searchParams.get("ownerUserId") ?? session.user.id;
    const question = url.searchParams.get("q") ?? "What do you know?";

    const prepared = await container.twinIntelligence.prepare({
      ownerUserId,
      viewerUserId: session.user.id,
      question,
      conversationId: "00000000-0000-0000-0000-000000000000",
      publicOnly: ownerUserId !== session.user.id,
    });

    return jsonOk({
      sources: prepared.extendedCitations,
      citations: prepared.citations,
    });
  } catch (error) {
    return jsonError(error);
  }
}
