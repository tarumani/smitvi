import { jsonOk } from "@/infrastructure/http/respond";
import { getStorageDriver } from "@/infrastructure/storage/object-storage";

export async function GET() {
  return jsonOk({
    ok: true,
    service: "smitvi",
    env: process.env.NODE_ENV ?? "development",
    storage: getStorageDriver(),
    time: new Date().toISOString(),
  });
}
