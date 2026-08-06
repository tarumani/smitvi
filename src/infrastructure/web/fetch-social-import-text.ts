import { ValidationError } from "@/domain/shared/errors";
import { fetchWebsiteText } from "@/infrastructure/web/fetch-website-text";

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "SmitviImport/1.0 (+https://smitvi.com)",
};

function decodeBase64Utf8(data: string): string {
  return Buffer.from(data, "base64").toString("utf8");
}

export async function fetchGitHubImportText(
  sourceUrl: string,
): Promise<{ title: string; text: string }> {
  let url: URL;
  try {
    url = new URL(sourceUrl.trim());
  } catch {
    throw new ValidationError("Enter a valid GitHub URL");
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host !== "github.com") {
    throw new ValidationError("URL must be a github.com link");
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const [owner, repo] = segments;
    const repoName = repo.replace(/\.git$/, "");
    const readmeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/readme`,
      { headers: GITHUB_HEADERS },
    );
    if (!readmeRes.ok) {
      throw new ValidationError(
        "Could not read this repo README. Check the URL is public.",
      );
    }
    const readmeJson = (await readmeRes.json()) as {
      content?: string;
      name?: string;
    };
    const text = readmeJson.content
      ? decodeBase64Utf8(readmeJson.content.replace(/\n/g, ""))
      : "";
    if (text.trim().length < 20) {
      throw new ValidationError("README has too little text to import");
    }
    return {
      title: `${owner}/${repoName}`,
      text: text.slice(0, 120_000),
    };
  }

  if (segments.length === 1) {
    const username = segments[0];
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers: GITHUB_HEADERS,
      }),
      fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
        { headers: GITHUB_HEADERS },
      ),
    ]);
    if (!userRes.ok) {
      throw new ValidationError("GitHub user not found or API limit reached");
    }
    const user = (await userRes.json()) as {
      name?: string | null;
      login?: string;
      bio?: string | null;
      blog?: string | null;
      company?: string | null;
      location?: string | null;
    };
    const repos = reposRes.ok
      ? ((await reposRes.json()) as Array<{
          name: string;
          description: string | null;
          html_url: string;
        }>)
      : [];

    const parts = [
      user.name ? `Name: ${user.name}` : null,
      user.login ? `GitHub: @${user.login}` : null,
      user.bio ? `Bio: ${user.bio}` : null,
      user.company ? `Company: ${user.company}` : null,
      user.location ? `Location: ${user.location}` : null,
      user.blog ? `Website: ${user.blog}` : null,
      repos.length
        ? "Repositories:\n" +
          repos
            .map(
              (r) =>
                `- ${r.name}${r.description ? `: ${r.description}` : ""} (${r.html_url})`,
            )
            .join("\n")
        : null,
    ].filter(Boolean);

    const text = parts.join("\n\n");
    if (text.length < 20) {
      throw new ValidationError("Not enough public GitHub profile data to import");
    }
    return {
      title: `@${username} on GitHub`,
      text: text.slice(0, 120_000),
    };
  }

  throw new ValidationError(
    "Use a GitHub profile (github.com/username) or repo (github.com/user/repo) URL",
  );
}

export async function fetchYouTubeImportText(
  sourceUrl: string,
): Promise<{ title: string; text: string }> {
  let url: URL;
  try {
    url = new URL(sourceUrl.trim());
  } catch {
    throw new ValidationError("Enter a valid YouTube URL");
  }

  const host = url.hostname.replace(/^www\./, "");
  if (!["youtube.com", "youtu.be", "m.youtube.com"].includes(host)) {
    throw new ValidationError("URL must be a YouTube video or channel link");
  }

  let videoId: string | null = null;
  if (host === "youtu.be") {
    videoId = url.pathname.slice(1).split("/")[0] || null;
  } else if (url.pathname.startsWith("/watch")) {
    videoId = url.searchParams.get("v");
  } else if (url.pathname.startsWith("/shorts/")) {
    videoId = url.pathname.split("/")[2] ?? null;
  }

  if (videoId) {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageRes = await fetch(watchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SmitviImport/1.0; +https://smitvi.com)",
        "Accept-Language": "en",
      },
    });
    if (!pageRes.ok) {
      throw new ValidationError("Could not load this YouTube video");
    }
    const html = await pageRes.text();
    const title =
      metaContent(html, "og:title") ??
      metaContent(html, "title") ??
      "YouTube video";
    const description =
      metaContent(html, "og:description") ??
      metaContent(html, "description") ??
      "";
    const text = [`Title: ${title}`, description ? `Description: ${description}` : null]
      .filter(Boolean)
      .join("\n\n");
    if (text.length < 30) {
      throw new ValidationError(
        "Could not extract enough text from this video. Try a video with a written description.",
      );
    }
    return { title: title.slice(0, 200), text: text.slice(0, 120_000) };
  }

  const channelPath = url.pathname;
  if (
    channelPath.startsWith("/@") ||
    channelPath.startsWith("/channel/") ||
    channelPath.startsWith("/c/")
  ) {
    const channelUrl = url.toString();
    const pageRes = await fetch(channelUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SmitviImport/1.0; +https://smitvi.com)",
        "Accept-Language": "en",
      },
    });
    if (!pageRes.ok) {
      throw new ValidationError("Could not load this YouTube channel");
    }
    const html = await pageRes.text();
    const title =
      metaContent(html, "og:title") ?? metaContent(html, "title") ?? "YouTube channel";
    const description =
      metaContent(html, "og:description") ?? metaContent(html, "description") ?? "";
    const text = [
      `Channel: ${title}`,
      description ? `About: ${description}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");
    if (text.length < 30) {
      throw new ValidationError(
        "Could not extract channel text. Try a specific video URL instead.",
      );
    }
    return { title: title.slice(0, 200), text: text.slice(0, 120_000) };
  }

  throw new ValidationError(
    "Use a video (watch, shorts, youtu.be) or channel (@name) URL",
  );
}

function metaContent(html: string, key: string): string | null {
  const og = html.match(
    new RegExp(
      `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
  );
  if (og?.[1]) return decodeHtmlEntities(og[1].trim());
  const name = html.match(
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
  );
  if (name?.[1]) return decodeHtmlEntities(name[1].trim());
  if (key === "title") {
    const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return t?.[1] ? decodeHtmlEntities(t[1].trim()) : null;
  }
  return null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function fetchLinkedInImportText(
  sourceUrl: string,
): Promise<{ title: string; text: string }> {
  let url: URL;
  try {
    url = new URL(sourceUrl.trim());
  } catch {
    throw new ValidationError("Enter a valid LinkedIn URL");
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host !== "linkedin.com") {
    throw new ValidationError("URL must be a linkedin.com profile or page link");
  }

  const path = url.pathname;
  if (
    !path.startsWith("/in/") &&
    !path.startsWith("/company/") &&
    !path.startsWith("/pub/")
  ) {
    throw new ValidationError(
      "Use a public profile (/in/your-name) or company page URL",
    );
  }

  try {
    const text = await fetchWebsiteText(url.toString());
    const slug = path.split("/").filter(Boolean).pop() ?? "LinkedIn";
    return {
      title: `LinkedIn · ${slug}`,
      text,
    };
  } catch {
    throw new ValidationError(
      "LinkedIn blocked this import. Export your profile as PDF or paste your About section under Train Twin → upload text.",
    );
  }
}
