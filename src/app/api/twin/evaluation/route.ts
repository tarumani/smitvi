import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    await requireSession();
    const report = container.twinEvaluation.evaluateUnderstanding();
    return jsonOk({ evaluation: report });
  } catch (error) {
    return jsonError(error);
  }
}
