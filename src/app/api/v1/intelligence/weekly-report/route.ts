import { requireSession } from "@/application/auth/get-current-session";
import { WeeklyIntelligenceReportService } from "@/application/intelligence/weekly-report-service";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const report = await new WeeklyIntelligenceReportService().getOrCreate(
      session.user.id,
    );
    return jsonOk({ report });
  } catch (error) {
    return jsonError(error);
  }
}
