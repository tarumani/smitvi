import { prisma } from "@/infrastructure/database/prisma";
import { WeeklyIntelligenceReportService } from "@/application/intelligence/weekly-report-service";
import { UnauthorizedError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) return jsonError(new UnauthorizedError());
  try {
    const users = await prisma.profile.findMany({
      where: { isOnboarded: true, user: { deletedAt: null } },
      select: { userId: true },
      take: 200,
    });
    const service = new WeeklyIntelligenceReportService();
    let created = 0;
    for (const row of users) {
      await service.getOrCreate(row.userId);
      created += 1;
    }
    return jsonOk({ created });
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(request: Request) {
  return POST(request);
}
