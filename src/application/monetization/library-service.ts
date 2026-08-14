import { prisma } from "@/infrastructure/database/prisma";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import {
  createSignedDownloadUrl,
  readUpload,
} from "@/infrastructure/storage/object-storage";
import {
  mintLibraryDownloadToken,
  verifyLibraryDownloadToken,
} from "@/application/monetization/library-download-token";
import { PRODUCTION_APP_URL } from "@/config/constants";

export type LibraryDownloadKind =
  | "signed_url"
  | "stream_url"
  | "public_url"
  | "text"
  | "none";

type ResolvedPrivateFile = {
  kind: "private_file";
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  byteSize: number | null;
};

type ResolvedPublicUrl = {
  kind: "public_url";
  url: string;
  fileName: string | null;
};

type ResolvedText = {
  kind: "text";
  text: string;
};

type ResolvedNone = { kind: "none" };

type ResolvedAsset =
  | ResolvedPrivateFile
  | ResolvedPublicUrl
  | ResolvedText
  | ResolvedNone;

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || PRODUCTION_APP_URL
  );
}

function stripStoragePrefix(reference: string): string {
  return reference.replace(/^storage:/i, "").trim();
}

function looksLikeStorageKey(reference: string): boolean {
  const key = stripStoragePrefix(reference);
  if (!key || key.includes(" ") || key.includes("\n")) return false;
  if (/^https?:\/\//i.test(key) || key.startsWith("//") || key.startsWith("/")) {
    return false;
  }
  // userId/uuid-filename from object-storage buildObjectKey
  return /^[0-9a-f-]{36}\/[0-9a-f-]{36}-[\w.-]+$/i.test(key);
}

function normalizeContentUrl(reference: string | null): string | null {
  if (!reference) return null;
  const trimmed = reference.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return `${appOrigin()}${trimmed}`;
  return null;
}

function classifyContentReference(
  reference: string | null,
): "url" | "image" | "text" | "none" {
  if (!reference) return "none";
  if (looksLikeStorageKey(reference) || /^storage:/i.test(reference)) {
    return "none";
  }
  const url = normalizeContentUrl(reference);
  if (url) {
    if (/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)) return "image";
    return "url";
  }
  if (reference.length >= 8) return "text";
  return "none";
}

function guessMimeFromName(name: string | null | undefined): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text/plain";
  if (lower.endsWith(".zip")) return "application/zip";
  return null;
}

export class LibraryService {
  async listForUser(userId: string) {
    const [access, orders, twinSubs] = await Promise.all([
      prisma.marketplaceAccess.findMany({
        where: { userId },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              type: true,
              slug: true,
              thumbnailUrl: true,
              contentReference: true,
              knowledgeSourceId: true,
            },
          },
        },
        orderBy: { grantedAt: "desc" },
      }),
      prisma.marketplaceOrder.findMany({
        where: { buyerId: userId, status: { in: ["PAID", "FULFILLED"] } },
        include: { listing: { select: { title: true, type: true } } },
        take: 30,
      }),
      prisma.twinCreatorSubscription.findMany({
        where: { subscriberId: userId, status: "ACTIVE" },
        include: {
          creator: {
            include: {
              profile: { select: { username: true, displayName: true } },
            },
          },
        },
      }),
    ]);

    return { access, orders, twinSubscriptions: twinSubs };
  }

  private async requireAccess(userId: string, listingId: string) {
    const access = await prisma.marketplaceAccess.findUnique({
      where: {
        userId_listingId: { userId, listingId },
      },
      include: {
        listing: {
          include: {
            seller: {
              include: {
                profile: {
                  select: {
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!access) {
      throw new NotFoundError("Library item not found or not unlocked");
    }

    return access;
  }

  private async resolveAsset(listing: {
    sellerId: string;
    contentReference: string | null;
    knowledgeSourceId: string | null;
    title: string;
  }): Promise<ResolvedAsset> {
    if (listing.knowledgeSourceId) {
      const source = await prisma.knowledgeSource.findFirst({
        where: {
          id: listing.knowledgeSourceId,
          userId: listing.sellerId,
        },
        select: {
          title: true,
          originalName: true,
          mimeType: true,
          byteSize: true,
          storagePath: true,
          sourceUrl: true,
          extractedText: true,
          summary: true,
        },
      });

      if (source?.storagePath) {
        return {
          kind: "private_file",
          storagePath: source.storagePath,
          fileName:
            source.originalName?.trim() ||
            source.title?.trim() ||
            `${listing.title}.bin`,
          mimeType: source.mimeType ?? guessMimeFromName(source.originalName),
          byteSize: source.byteSize,
        };
      }

      if (source?.sourceUrl) {
        const url = normalizeContentUrl(source.sourceUrl);
        if (url) {
          return {
            kind: "public_url",
            url,
            fileName: source.originalName ?? source.title,
          };
        }
      }

      const text =
        source?.extractedText?.trim() ||
        source?.summary?.trim() ||
        null;
      if (text) {
        return { kind: "text", text: text.slice(0, 20_000) };
      }
    }

    const ref = listing.contentReference?.trim() || null;
    if (!ref) return { kind: "none" };

    if (looksLikeStorageKey(ref) || /^storage:/i.test(ref)) {
      const storagePath = stripStoragePrefix(ref);
      const fileName = storagePath.split("/").pop() || `${listing.title}.bin`;
      return {
        kind: "private_file",
        storagePath,
        fileName,
        mimeType: guessMimeFromName(fileName),
        byteSize: null,
      };
    }

    const url = normalizeContentUrl(ref);
    if (url) {
      return { kind: "public_url", url, fileName: null };
    }

    if (ref.length >= 8) {
      return { kind: "text", text: ref };
    }

    return { kind: "none" };
  }

  /** Buyer-only detail for an unlocked listing (preview / content). */
  async getAccessDetail(userId: string, listingId: string) {
    const access = await this.requireAccess(userId, listingId);
    const listing = access.listing;
    const contentReference = listing.contentReference?.trim() || null;
    const asset = await this.resolveAsset(listing);

    let previewKind = classifyContentReference(
      asset.kind === "private_file" ? null : contentReference,
    );
    let previewUrl =
      previewKind === "url" || previewKind === "image"
        ? normalizeContentUrl(contentReference)
        : null;
    let previewText =
      previewKind === "text" ? contentReference : null;

    if (asset.kind === "public_url") {
      previewUrl = asset.url;
      previewKind = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(asset.url)
        ? "image"
        : "url";
      previewText = null;
    } else if (asset.kind === "text") {
      previewKind = "text";
      previewText = asset.text;
      previewUrl = null;
    } else if (asset.kind === "private_file") {
      previewKind = "none";
      previewUrl = null;
      previewText = null;
    }

    const safeContentReference =
      asset.kind === "private_file"
        ? null
        : contentReference && looksLikeStorageKey(contentReference)
          ? null
          : contentReference;

    return {
      access: {
        id: access.id,
        listingId: access.listingId,
        orderId: access.orderId,
        grantedAt: access.grantedAt,
      },
      listing: {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        type: listing.type,
        slug: listing.slug,
        thumbnailUrl: listing.thumbnailUrl,
        contentReference: safeContentReference,
        knowledgeSourceId: listing.knowledgeSourceId,
        durationMinutes: listing.durationMinutes,
        currency: listing.currency,
        priceCents: listing.priceCents,
      },
      seller: listing.seller.profile
        ? {
            userId: listing.sellerId,
            username: listing.seller.profile.username,
            displayName: listing.seller.profile.displayName,
            avatarUrl: listing.seller.profile.avatarUrl,
          }
        : {
            userId: listing.sellerId,
            username: null as string | null,
            displayName: null as string | null,
            avatarUrl: null as string | null,
          },
      preview: {
        kind: previewKind,
        url: previewUrl,
        text: previewText,
      },
      download: {
        available:
          asset.kind === "private_file" || asset.kind === "public_url",
        kind:
          asset.kind === "private_file"
            ? ("file" as const)
            : asset.kind === "public_url"
              ? ("public_url" as const)
              : asset.kind === "text"
                ? ("text" as const)
                : ("none" as const),
        fileName:
          asset.kind === "private_file"
            ? asset.fileName
            : asset.kind === "public_url"
              ? asset.fileName
              : null,
        mimeType: asset.kind === "private_file" ? asset.mimeType : null,
        byteSize: asset.kind === "private_file" ? asset.byteSize : null,
      },
    };
  }

  /**
   * Mint a short-lived download URL for unlocked private/public content.
   * Prefer Supabase signed URLs; fall back to HMAC stream URL.
   */
  async createDownloadLink(
    userId: string,
    listingId: string,
    expiresInSeconds = 300,
  ) {
    const access = await this.requireAccess(userId, listingId);
    const asset = await this.resolveAsset(access.listing);

    if (asset.kind === "public_url") {
      return {
        mode: "public_url" as const satisfies LibraryDownloadKind,
        url: asset.url,
        expiresAt: null as string | null,
        fileName: asset.fileName,
        mimeType: null as string | null,
        byteSize: null as number | null,
      };
    }

    if (asset.kind === "text") {
      return {
        mode: "text" as const satisfies LibraryDownloadKind,
        url: null as string | null,
        expiresAt: null as string | null,
        fileName: null as string | null,
        mimeType: "text/plain" as string | null,
        byteSize: asset.text.length,
        text: asset.text,
      };
    }

    if (asset.kind !== "private_file") {
      throw new NotFoundError("No downloadable content for this item");
    }

    const signed = await createSignedDownloadUrl(
      asset.storagePath,
      expiresInSeconds,
    ).catch(() => null);

    if (signed) {
      return {
        mode: "signed_url" as const satisfies LibraryDownloadKind,
        url: signed,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        byteSize: asset.byteSize,
      };
    }

    const { token, expiresAt } = mintLibraryDownloadToken(
      {
        userId,
        listingId,
        storagePath: asset.storagePath,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      },
      expiresInSeconds,
    );

    return {
      mode: "stream_url" as const satisfies LibraryDownloadKind,
      url: `${appOrigin()}/api/v1/marketplace/library/${listingId}/download/stream?token=${encodeURIComponent(token)}`,
      expiresAt: expiresAt.toISOString(),
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      byteSize: asset.byteSize,
    };
  }

  /** Stream private bytes after verifying HMAC token (no session cookie needed). */
  async streamWithToken(token: string) {
    const payload = verifyLibraryDownloadToken(token);

    const access = await prisma.marketplaceAccess.findUnique({
      where: {
        userId_listingId: {
          userId: payload.userId,
          listingId: payload.listingId,
        },
      },
      include: {
        listing: {
          select: {
            sellerId: true,
            contentReference: true,
            knowledgeSourceId: true,
            title: true,
          },
        },
      },
    });

    if (!access) {
      throw new NotFoundError("Library item not found or not unlocked");
    }

    const asset = await this.resolveAsset(access.listing);
    if (
      asset.kind !== "private_file" ||
      asset.storagePath !== payload.storagePath
    ) {
      throw new ValidationError("Download token does not match content");
    }

    const bytes = await readUpload(payload.storagePath);
    return {
      bytes,
      fileName: payload.fileName || asset.fileName,
      mimeType: payload.mimeType || asset.mimeType || "application/octet-stream",
    };
  }
}

export class ReviewService {
  async create(input: {
    userId: string;
    listingId: string;
    rating: number;
    body?: string | null;
  }) {
    if (input.rating < 1 || input.rating > 5) {
      throw new ValidationError("Rating must be 1–5");
    }

    const access = await prisma.marketplaceAccess.findUnique({
      where: {
        userId_listingId: {
          userId: input.userId,
          listingId: input.listingId,
        },
      },
    });

    const review = await prisma.marketplaceReview.upsert({
      where: {
        listingId_userId: {
          listingId: input.listingId,
          userId: input.userId,
        },
      },
      create: {
        listingId: input.listingId,
        userId: input.userId,
        rating: input.rating,
        body: input.body,
        verifiedPurchase: Boolean(access),
      },
      update: {
        rating: input.rating,
        body: input.body,
      },
    });

    const agg = await prisma.marketplaceReview.aggregate({
      where: { listingId: input.listingId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.marketplaceListing.update({
      where: { id: input.listingId },
      data: {
        ratingAverage: agg._avg.rating ?? 0,
        ratingCount: agg._count.id,
      },
    });

    return review;
  }
}
