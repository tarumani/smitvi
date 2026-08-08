import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

async function knowledgeRecs() {
  const session = await requireSession();
  return container.recommendations.recommendKnowledge(session.user.id);
}

export async function GET() {
  try {
    const knowledge = await knowledgeRecs();
    return jsonOk({ knowledge });
  } catch (error) {
    return jsonError(error);
  }
}
