import { prisma } from "@/infrastructure/database/prisma";

export class GetIntelligenceTimeline {
  async execute(userId: string, limit = 20) {
    const rows = await prisma.meaningfulActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
