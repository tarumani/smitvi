import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const listings = await container.marketplace.listActive(40);
    const filtered = q
      ? listings.filter(
          (l) =>
            l.title.toLowerCase().includes(q.toLowerCase()) ||
            l.description.toLowerCase().includes(q.toLowerCase()),
        )
      : listings;
    return jsonOk({ products: filtered });
  } catch (error) {
    return jsonError(error);
  }
}
