import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const library = await container.library.listForUser(session.user.id);
    return jsonOk({ library });
  } catch (error) {
    return jsonError(error);
  }
}
