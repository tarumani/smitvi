/**
 * Resolve a browser-safe public origin for redirects.
 *
 * Next.js standalone on Fly/Docker binds with HOSTNAME=0.0.0.0. Using
 * `request.url` / `nextUrl.origin` as-is can produce Location headers like
 * https://0.0.0.0:3000/... which browsers reject (ERR_ADDRESS_INVALID).
 */
function isUnusableHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "0.0.0.0" ||
    host === "[::]" ||
    host === "::" ||
    host === "*"
  );
}

function firstHeaderValue(value: string | null): string | null {
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
}

function originFromHost(proto: string, host: string): string | null {
  const hostname = host.split(":")[0] ?? "";
  if (!hostname || isUnusableHostname(hostname)) return null;
  const protocol = proto === "http" ? "http" : "https";
  return `${protocol}://${host}`;
}

export function getRequestOrigin(request: Request): string {
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = firstHeaderValue(
    request.headers.get("x-forwarded-proto"),
  );
  const hostHeader = firstHeaderValue(request.headers.get("host"));

  if (forwardedHost) {
    const fromForwarded = originFromHost(forwardedProto ?? "https", forwardedHost);
    if (fromForwarded) return fromForwarded;
  }

  if (hostHeader) {
    let proto = forwardedProto;
    if (!proto) {
      try {
        proto = new URL(request.url).protocol.replace(":", "") || "https";
      } catch {
        proto = "https";
      }
    }
    const fromHost = originFromHost(proto, hostHeader);
    if (fromHost) return fromHost;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (appUrl) {
    try {
      const parsed = new URL(appUrl);
      if (!isUnusableHostname(parsed.hostname)) return appUrl;
    } catch {
      // fall through
    }
  }

  return "http://localhost:3000";
}

/** Browser-side: never send OAuth/email redirects to 0.0.0.0. */
export function getBrowserOrigin(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  }

  try {
    const url = new URL(window.location.origin);
    if (isUnusableHostname(url.hostname)) {
      return `http://localhost:${url.port || "3000"}`;
    }
  } catch {
    // fall through
  }

  return window.location.origin;
}
