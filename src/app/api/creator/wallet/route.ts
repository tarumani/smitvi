import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const wallet = await container.creatorWallet.getOrCreate(session.user.id);
    return jsonOk({ wallet });
  } catch (error) {
    return jsonError(error);
  }
}
