const MAX_WEBSITE_BYTES = 512_000;

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchWebsiteText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SmitviImportBot/1.0 (+https://smitvi.com)",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    if (!response.ok) {
      throw new Error(`Website returned ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_WEBSITE_BYTES) {
      throw new Error("Website page is too large to import");
    }
    const html = buffer.toString("utf8");
    const text = stripHtml(html);
    if (text.length < 40) {
      throw new Error("Not enough readable text found on this page");
    }
    return text.slice(0, 120_000);
  } finally {
    clearTimeout(timeout);
  }
}
