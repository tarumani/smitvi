import { randomUUID } from "node:crypto";
import {
  deleteUploadLocally,
  readUploadLocally,
  saveUploadLocally,
} from "@/infrastructure/storage/local-storage";
import { getSupabaseAdmin } from "@/infrastructure/auth/supabase/admin";

export type StorageDriver = "local" | "supabase";

const DEFAULT_BUCKET = "knowledge";

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

export async function saveUpload(
  userId: string,
  fileName: string,
  bytes: Buffer,
): Promise<string> {
  const driver = getStorageDriver();
  if (driver === "local") {
    return saveUploadLocally(userId, fileName, bytes);
  }

  const key = buildObjectKey(userId, fileName);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(getBucket())
    .upload(key, bytes, {
      contentType: "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return key;
}

export async function readUpload(storagePath: string): Promise<Buffer> {
  const driver = getStorageDriver();
  if (driver === "local") {
    return readUploadLocally(storagePath);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(getBucket())
    .download(storagePath);

  if (error || !data) {
    throw new Error(
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

  const supabase = getSupabaseAdmin();
  await supabase.storage.from(getBucket()).remove([storagePath]);
}
