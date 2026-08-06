const MAX_WEBSITE_BYTES = 512_000;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Reader proxy for JS-heavy or bot-protected pages (LinkedIn, Notion, etc.). */
export async function fetchReaderText(url: string): Promise<string> {
  const normalized = url.trim();
  const target = normalized.startsWith("http") ? normalized : `https://${normalized}`;
  const readerUrl = `https://r.jina.ai/${target}`;

  const headers: Record<string, string> = {
    Accept: "text/plain",
    "X-Return-Format": "text",
  };
  const jinaKey = process.env.JINA_READER_API_KEY?.trim();
  if (jinaKey) {
    headers.Authorization = `Bearer ${jinaKey}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(readerUrl, {
      signal: controller.signal,
      headers,
    });
    if (!response.ok) {
      throw new Error(`Reader returned ${response.status}`);
    }
    const text = (await response.text()).trim();
    if (text.length < 40) {
      throw new Error("Not enough readable text from reader");
    }
    return text.slice(0, 120_000);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchWebsiteText(
  url: string,
  options?: { preferReader?: boolean },
): Promise<string> {
  if (options?.preferReader) {
    try {
      return await fetchReaderText(url);
    } catch {
      /* fall through to direct fetch */
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
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
  } catch (directError) {
    try {
      return await fetchReaderText(url);
    } catch {
      throw directError instanceof Error
        ? directError
        : new Error("Could not read this page");
    }
  } finally {
    clearTimeout(timeout);
  }
}
