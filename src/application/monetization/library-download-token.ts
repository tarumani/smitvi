import { createHmac, timingSafeEqual } from "node:crypto";
import { ValidationError } from "@/domain/shared/errors";

const DEFAULT_TTL_SECONDS = 300;

function signingSecret(): string {
  const secret =
    process.env.LIBRARY_DOWNLOAD_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) {
    throw new ValidationError(
      "Library download signing is not configured (set LIBRARY_DOWNLOAD_SECRET)",
    );
  }
  return secret;
}

export type LibraryDownloadTokenPayload = {
  userId: string;
  listingId: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  exp: number;
};

function encodePayload(payload: LibraryDownloadTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function sign(body: string): string {
  return createHmac("sha256", signingSecret()).update(body).digest("base64url");
}

export function mintLibraryDownloadToken(
  input: Omit<LibraryDownloadTokenPayload, "exp">,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): { token: string; expiresAt: Date } {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload: LibraryDownloadTokenPayload = { ...input, exp };
  const body = encodePayload(payload);
  const token = `${body}.${sign(body)}`;
  return { token, expiresAt: new Date(exp * 1000) };
}

export function verifyLibraryDownloadToken(
  token: string,
): LibraryDownloadTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 2) {
    throw new ValidationError("Invalid download token");
  }
  const [body, sig] = parts as [string, string];
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ValidationError("Invalid download token");
  }

  let payload: LibraryDownloadTokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as LibraryDownloadTokenPayload;
  } catch {
    throw new ValidationError("Invalid download token");
  }

  if (
    !payload?.userId ||
    !payload.listingId ||
    !payload.storagePath ||
    typeof payload.exp !== "number"
  ) {
    throw new ValidationError("Invalid download token");
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new ValidationError("Download link expired");
  }

  return payload;
}
