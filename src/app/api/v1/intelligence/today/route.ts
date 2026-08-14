import { requireSession } from "@/application/auth/get-current-session";
import { GetTodayIntelligence } from "@/application/intelligence/get-today-intelligence";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const data = await new GetTodayIntelligence().execute(session.user.id);
    return jsonOk(data);
  } catch (error) {
    return jsonError(error);
  }
}
