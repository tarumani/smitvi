import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), ".data", "uploads");

export async function saveUploadLocally(
  userId: string,
  fileName: string,
  bytes: Buffer,
): Promise<string> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const relative = path.join(userId, `${randomUUID()}-${safeName}`);
  const absolute = path.join(UPLOAD_ROOT, relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
  return relative.replace(/\\/g, "/");
}

export async function readUploadLocally(storagePath: string): Promise<Buffer> {
  const absolute = path.join(UPLOAD_ROOT, storagePath);
  return readFile(absolute);
}

export async function deleteUploadLocally(storagePath: string): Promise<void> {
  const absolute = path.join(UPLOAD_ROOT, storagePath);
  await unlink(absolute).catch(() => undefined);
}
