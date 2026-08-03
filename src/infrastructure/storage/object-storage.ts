import { randomUUID } from "node:crypto";
import { ValidationError } from "@/domain/shared/errors";
import {
  deleteUploadLocally,
  readUploadLocally,
  saveUploadLocally,
} from "@/infrastructure/storage/local-storage";
import { getSupabaseAdmin } from "@/infrastructure/auth/supabase/admin";

export type StorageDriver = "local" | "supabase";

const DEFAULT_BUCKET = "knowledge";

let bucketReady: Promise<string> | null = null;

export function getStorageDriver(): StorageDriver {
  const explicit = process.env.STORAGE_DRIVER;
  if (explicit === "supabase" || explicit === "local") return explicit;
  return process.env.NODE_ENV === "production" ? "supabase" : "local";
}

function getBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_BUCKET;
}

function buildObjectKey(userId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${randomUUID()}-${safeName}`;
}

async function ensureSupabaseBucket(): Promise<string> {
  const bucket = getBucket();
  if (!bucketReady) {
    bucketReady = (async () => {
      const supabase = getSupabaseAdmin();
      const { data: existing, error: listError } =
        await supabase.storage.listBuckets();

      if (listError) {
        throw new ValidationError(
          `Storage is not ready (${listError.message}). Check Supabase service role key and Storage settings.`,
        );
      }

      const found = existing?.some((item) => item.name === bucket);
      if (!found) {
        const { error: createError } = await supabase.storage.createBucket(
          bucket,
          {
            public: false,
            fileSizeLimit: 15 * 1024 * 1024,
          },
        );

        // Another request may create it first — treat "already exists" as success.
        if (
          createError &&
          !/already exists|duplicate/i.test(createError.message)
        ) {
          throw new ValidationError(
            `Could not create storage bucket "${bucket}". In Supabase → Storage, create a private bucket named "${bucket}", then try again. (${createError.message})`,
          );
        }
      }

      return bucket;
    })().catch((error) => {
      bucketReady = null;
      throw error;
    });
  }
  return bucketReady;
}

export async function saveUpload(
  userId: string,
  fileName: string,
  bytes: Buffer,
): Promise<string> {
  const driver = getStorageDriver();
  if (driver === "local") {
    return saveUploadLocally(userId, fileName, bytes);
  }

  const bucket = await ensureSupabaseBucket();
  const key = buildObjectKey(userId, fileName);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(key, bytes, {
    contentType: "application/octet-stream",
    upsert: false,
  });

  if (error) {
    if (/bucket not found/i.test(error.message)) {
      throw new ValidationError(
        `Storage bucket "${bucket}" was not found. Create a private bucket named "${bucket}" in Supabase → Storage, then try again.`,
      );
    }
    throw new ValidationError(`Storage upload failed: ${error.message}`);
  }

  return key;
}

export async function readUpload(storagePath: string): Promise<Buffer> {
  const driver = getStorageDriver();
  if (driver === "local") {
    return readUploadLocally(storagePath);
  }

  const bucket = await ensureSupabaseBucket();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(storagePath);

  if (error || !data) {
    throw new ValidationError(
      `Storage download failed: ${error?.message ?? "missing object"}`,
    );
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function deleteUpload(storagePath: string): Promise<void> {
  const driver = getStorageDriver();
  if (driver === "local") {
    await deleteUploadLocally(storagePath);
    return;
  }

  const bucket = await ensureSupabaseBucket();
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(bucket).remove([storagePath]);
}
