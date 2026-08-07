import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { ValidationError } from "@/domain/shared/errors";
import { getSupabaseAdmin } from "@/infrastructure/auth/supabase/admin";
import { getStorageDriver } from "@/infrastructure/storage/object-storage";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_BUCKET =
  process.env.SUPABASE_AVATARS_BUCKET?.trim() || "avatars";

const LOCAL_AVATAR_ROOT = path.join(process.cwd(), ".data", "avatars");

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateAvatarFile(file: File, bytes: Buffer): void {
  if (bytes.length === 0) {
    throw new ValidationError("Choose an image file");
  }
  if (bytes.length > AVATAR_MAX_BYTES) {
    throw new ValidationError("Photo must be 5 MB or smaller");
  }
  const mime = file.type?.toLowerCase() || "";
  if (mime && !ALLOWED_MIME.has(mime)) {
    throw new ValidationError("Use JPEG, PNG, WebP, or GIF");
  }
}

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

function localAvatarPath(userId: string, ext: string): string {
  return path.join(LOCAL_AVATAR_ROOT, userId, `avatar.${ext}`);
}

export function publicAvatarPath(userId: string): string {
  return `/api/v1/avatars/${userId}`;
}

export async function saveAvatarForUser(
  userId: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  const mime = contentType.toLowerCase() || "image/jpeg";
  const ext = extensionForMime(mime);
  const driver = getStorageDriver();

  if (driver === "local") {
    const absolute = localAvatarPath(userId, ext);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, bytes);
    return publicAvatarPath(userId);
  }

  const supabase = getSupabaseAdmin();
  const key = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(key, bytes, {
    contentType: mime,
    upsert: true,
  });

  if (error) {
    if (/bucket not found/i.test(error.message)) {
      throw new ValidationError(
        `Avatar storage bucket "${AVATAR_BUCKET}" was not found. Create a public bucket named "${AVATAR_BUCKET}" in Supabase → Storage.`,
      );
    }
    throw new ValidationError(`Photo upload failed: ${error.message}`);
  }

  return publicAvatarPath(userId);
}

export async function readAvatarBytes(userId: string): Promise<{
  bytes: Buffer;
  contentType: string;
} | null> {
  const driver = getStorageDriver();

  if (driver === "local") {
    for (const ext of ["jpg", "jpeg", "png", "webp", "gif"]) {
      try {
        const bytes = await readFile(localAvatarPath(userId, ext));
        const contentType =
          ext === "png"
            ? "image/png"
            : ext === "webp"
              ? "image/webp"
              : ext === "gif"
                ? "image/gif"
                : "image/jpeg";
        return { bytes, contentType };
      } catch {
        continue;
      }
    }
    return null;
  }

  const supabase = getSupabaseAdmin();
  for (const ext of ["jpg", "png", "webp", "gif"]) {
    const key = `${userId}/avatar.${ext}`;
    const { data, error } = await supabase.storage.from(AVATAR_BUCKET).download(key);
    if (!error && data) {
      const contentType =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : ext === "gif"
              ? "image/gif"
              : "image/jpeg";
      return { bytes: Buffer.from(await data.arrayBuffer()), contentType };
    }
  }
  return null;
}
