import { prisma } from "@/infrastructure/database/prisma";
import type { ConsultationRequestStatus } from "@/generated/prisma/client";

export type ConsultationOfferEntity = {
  id: string;
  userId: string;
  enabled: boolean;
  headline: string | null;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  updatedAt: Date;
};

export type ConsultationRequestEntity = {
  id: string;
  offerId: string;
  expertUserId: string;
  requesterUserId: string | null;
  requesterName: string;
  requesterEmail: string;
  message: string | null;
  preferredAt: Date | null;
  status: ConsultationRequestStatus;
  createdAt: Date;
  updatedAt: Date;
};

function toOffer(row: {
  id: string;
  userId: string;
  enabled: boolean;
  headline: string | null;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  updatedAt: Date;
}): ConsultationOfferEntity {
  return {
    id: row.id,
    userId: row.userId,
    enabled: row.enabled,
    headline: row.headline,
    description: row.description,
    durationMinutes: row.durationMinutes,
    priceCents: row.priceCents,
    currency: row.currency,
    updatedAt: row.updatedAt,
  };
}

export class PrismaConsultationRepository {
  async getOfferByUserId(userId: string): Promise<ConsultationOfferEntity | null> {
    const row = await prisma.consultationOffer.findUnique({ where: { userId } });
    return row ? toOffer(row) : null;
  }

  async getEnabledOfferByUserId(
    userId: string,
  ): Promise<ConsultationOfferEntity | null> {
    const row = await prisma.consultationOffer.findFirst({
      where: { userId, enabled: true },
    });
    return row ? toOffer(row) : null;
  }

  async upsertOffer(
    userId: string,
    input: {
      enabled: boolean;
      headline?: string | null;
      description?: string | null;
      durationMinutes: number;
      priceCents: number;
      currency: string;
    },
  ): Promise<ConsultationOfferEntity> {
    const row = await prisma.consultationOffer.upsert({
      where: { userId },
      create: {
        userId,
        enabled: input.enabled,
        headline: input.headline ?? null,
        description: input.description ?? null,
        durationMinutes: input.durationMinutes,
        priceCents: input.priceCents,
        currency: input.currency.toUpperCase(),
      },
      update: {
        enabled: input.enabled,
        headline: input.headline ?? null,
        description: input.description ?? null,
        durationMinutes: input.durationMinutes,
        priceCents: input.priceCents,
        currency: input.currency.toUpperCase(),
      },
    });
    return toOffer(row);
  }

  async createRequest(input: {
    offerId: string;
    expertUserId: string;
    requesterUserId?: string | null;
    requesterName: string;
    requesterEmail: string;
    message?: string | null;
    preferredAt?: Date | null;
  }): Promise<ConsultationRequestEntity> {
    const row = await prisma.consultationRequest.create({
      data: {
        offerId: input.offerId,
        expertUserId: input.expertUserId,
        requesterUserId: input.requesterUserId ?? null,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail.toLowerCase(),
        message: input.message ?? null,
        preferredAt: input.preferredAt ?? null,
      },
    });
    return row;
  }

  async listRequestsForExpert(
    expertUserId: string,
  ): Promise<ConsultationRequestEntity[]> {
    return prisma.consultationRequest.findMany({
      where: { expertUserId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async updateRequestStatus(
    id: string,
    expertUserId: string,
    status: ConsultationRequestStatus,
  ): Promise<ConsultationRequestEntity | null> {
    const existing = await prisma.consultationRequest.findFirst({
      where: { id, expertUserId },
    });
    if (!existing) return null;
    return prisma.consultationRequest.update({
      where: { id },
      data: { status },
    });
  }
}
