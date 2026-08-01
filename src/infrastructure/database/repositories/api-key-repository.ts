import {
  generateApiKeySecret,
  hashApiKey,
  looksLikeApiKey,
} from "@/domain/api-keys/token";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/domain/shared/errors";
import { prisma } from "@/infrastructure/database/prisma";

export type ApiKeyPublic = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export class PrismaApiKeyRepository {
  async listForUser(userId: string): Promise<ApiKeyPublic[]> {
    return prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        revokedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async create(input: {
    userId: string;
    name: string;
    scopes?: string[];
  }): Promise<{ key: ApiKeyPublic; rawKey: string }> {
    const name = input.name.trim();
    if (name.length < 2 || name.length > 80) {
      throw new ValidationError("API key name must be 2–80 characters");
    }

    const activeCount = await prisma.apiKey.count({
      where: { userId: input.userId, revokedAt: null },
    });
    if (activeCount >= 10) {
      throw new ValidationError("Maximum of 10 active API keys reached");
    }

    const { rawKey, keyPrefix, keyHash } = generateApiKeySecret();
    const row = await prisma.apiKey.create({
      data: {
        userId: input.userId,
        name,
        keyPrefix,
        keyHash,
        scopes: input.scopes ?? ["twin:ask", "knowledge:read"],
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        revokedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return { key: row, rawKey };
  }

  async revoke(id: string, userId: string): Promise<void> {
    const existing = await prisma.apiKey.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundError("API key not found");
    if (existing.revokedAt) return;

    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async authenticate(rawKey: string) {
    if (!looksLikeApiKey(rawKey)) {
      throw new UnauthorizedError("Invalid API key");
    }

    const keyHash = hashApiKey(rawKey);
    const row = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });

    if (!row || row.revokedAt) {
      throw new UnauthorizedError("Invalid API key");
    }
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError("API key expired");
    }
    if (!row.user.isActive || row.user.isBanned) {
      throw new ForbiddenError("Account is not allowed to use the API");
    }

    await prisma.apiKey.update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      apiKeyId: row.id,
      scopes: row.scopes,
      user: row.user,
    };
  }

  requireScope(scopes: string[], scope: string) {
    if (!scopes.includes(scope) && !scopes.includes("*")) {
      throw new ForbiddenError(`API key is missing scope: ${scope}`);
    }
  }
}
