import { container } from "@/application/container";
import { jsonError } from "@/infrastructure/http/respond";
import { ValidationError } from "@/domain/shared/errors";
import { verifyLibraryDownloadToken } from "@/application/monetization/library-download-token";

type RouteContext = {
  params: Promise<{ listingId: string }>;
};

/**
 * Stream private library bytes via HMAC token (for local storage / WebBrowser).
 * No session required — token binds userId + listingId + path + expiry.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { listingId } = await context.params;
    const token = new URL(request.url).searchParams.get("token");
    if (!token) {
      throw new ValidationError("token query param required");
    }

    const payload = verifyLibraryDownloadToken(token);
    if (payload.listingId !== listingId) {
      throw new ValidationError("Download token listing mismatch");
    }

    const result = await container.library.streamWithToken(token);

    const headers = new Headers();
    headers.set(
      "Content-Type",
      result.mimeType || "application/octet-stream",
    );
    headers.set("Content-Length", String(result.bytes.length));
    headers.set(
      "Content-Disposition",
      `attachment; filename="${result.fileName.replace(/"/g, "")}"`,
    );
    headers.set("Cache-Control", "private, no-store");

    return new Response(new Uint8Array(result.bytes), {
      status: 200,
      headers,
    });
  } catch (error) {
    return jsonError(error);
  }
}
