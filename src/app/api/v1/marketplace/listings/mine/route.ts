import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const listings = await container.marketplace.listBySeller(session.user.id);
    return jsonOk({ listings });
  } catch (error) {
    return jsonError(error);
  }
}
