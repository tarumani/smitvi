"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Code2,
  FileText,
  Globe,
  PlayCircle,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

type SourceId =
  | "linkedin"
  | "notion"
  | "google-docs"
  | "website"
  | "files"
  | "github"
  | "youtube";

type SourceDef = {
  id: SourceId;
  label: string;
  hint: string;
  icon: LucideIcon;
  available: boolean;
  urlImport?: boolean;
  importType?: "WEBSITE" | "LINKEDIN" | "GITHUB" | "YOUTUBE" | "NOTION";
  placeholder?: string;
  urlHint?: string;
};

const SOURCES: SourceDef[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    hint: "Public profile",
    icon: Briefcase,
    available: true,
    urlImport: true,
    importType: "LINKEDIN",
    placeholder: "https://www.linkedin.com/in/your-name",
    urlHint:
      "Public profile or company page. If blocked, paste About text or upload a PDF export.",
  },
  {
    id: "notion",
    label: "Notion",
    hint: "Public pages",
    icon: StickyNote,
    available: true,
    urlImport: true,
    importType: "NOTION",
    placeholder: "https://www.notion.so/your-public-page",
    urlHint:
      "In Notion: Share → Publish to web, then paste the public link here.",
  },
  {
    id: "google-docs",
    label: "Google Docs",
    hint: "Published doc link",
    icon: FileText,
    available: true,
    urlImport: true,
    importType: "WEBSITE",
    placeholder: "https://docs.google.com/document/d/…/pub",
  },
  {
    id: "website",
    label: "Website",
    hint: "Blog, portfolio, site",
    icon: Globe,
    available: true,
    urlImport: true,
    importType: "WEBSITE",
    placeholder: "https://yoursite.com/about",
  },
  {
    id: "files",
    label: "PDF & docs",
    hint: "Upload files",
    icon: FileText,
    available: true,
  },
  {
    id: "github",
    label: "GitHub",
    hint: "Profile or repo",
    icon: Code2,
    available: true,
    urlImport: true,
    importType: "GITHUB",
    placeholder: "https://github.com/you or /you/repo",
    urlHint: "Imports README for repos, or bio + recent public repos for profiles.",
  },
  {
    id: "youtube",
    label: "YouTube",
    hint: "Video or channel",
    icon: PlayCircle,
    available: true,
    urlImport: true,
    importType: "YOUTUBE",
    placeholder: "https://www.youtube.com/watch?v=…",
    urlHint: "Imports title and description from public videos or channel pages.",
  },
];

type ConnectSourceGridProps = {
  mode: "marketing" | "interactive";
  className?: string;
  onImported?: () => void;
  uploadAnchorId?: string;
};

export function ConnectSourceGrid({
  mode,
  className,
  onImported,
  uploadAnchorId = "knowledge-upload",
}: ConnectSourceGridProps) {
  const [selected, setSelected] = useState<SourceId>("notion");

  if (mode === "marketing") {
    return (
      <ul
        className={cn(
          "mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3",
          className,
        )}
      >
        {SOURCES.map((source) => {
          const Icon = source.icon;
          return (
            <li
              key={source.id}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-left",
                !source.available && "opacity-90",
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold">{source.label}</span>
                <span className="block truncate text-[10px] text-[var(--muted)]">
                  {source.available
                    ? source.urlImport
                      ? "URL import"
                      : source.hint
                    : "Coming soon"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  const selectedSource = SOURCES.find((s) => s.id === selected)!;

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">
          Choose a source
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SOURCES.map((source) => {
            const Icon = source.icon;
            const isSelected = selected === source.id;
            return (
              <li key={source.id}>
                <button
                  type="button"
                  data-source-id={source.id}
                  onClick={() => setSelected(source.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/40"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      isSelected
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                        : "bg-[var(--accent-soft)] text-[var(--accent)]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">
                      {source.label}
                    </span>
                    <span className="block text-[10px] text-[var(--muted)]">
                      {!source.available
                        ? "Coming soon"
                        : source.id === "files"
                          ? "Upload below"
                          : source.hint}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <InteractiveSourcePanel
        source={selectedSource}
        uploadAnchorId={uploadAnchorId}
        onImported={onImported}
      />
    </div>
  );
}

function InteractiveSourcePanel({
  source,
  uploadAnchorId,
  onImported,
}: {
  source: SourceDef;
  uploadAnchorId: string;
  onImported?: () => void;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isPastePending, startPasteTransition] = useTransition();

  async function importPastedText(defaultTitle: string) {
    const content = pasteText.trim();
    if (content.length < 40) {
      toast.error("Add at least a few sentences of profile or page text");
      return;
    }
    const safeTitle =
      pasteTitle.trim() ||
      content.split(/\r?\n/).find((line) => line.trim())?.slice(0, 80) ||
      defaultTitle;
    const fileName = `${safeTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "import"}.txt`;
    const file = new File([content], fileName, { type: "text/plain" });
    const form = new FormData();
    form.append("file", file);
    form.append("title", safeTitle);
    const response = await fetch("/api/v1/knowledge", {
      method: "POST",
      body: form,
    });
    const json: unknown = await response.json();
    if (!response.ok) {
      throw new Error(
        typeof json === "object" &&
          json !== null &&
          "error" in json &&
          typeof (json as { error?: { message?: string } }).error?.message ===
            "string"
          ? (json as { error: { message: string } }).error.message
          : "Import failed",
      );
    }
    toast.success(`${source.label} text imported — training your Twin`);
    setPasteText("");
    setPasteTitle("");
    onImported?.();
    router.refresh();
  }

  if (!source.available) {
    return null;
  }

  if (source.id === "files") {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 px-4 py-5 text-sm">
        <p className="font-medium">Upload PDF, Word, slides, or text</p>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Scroll to the upload area — your Twin processes files automatically.
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-3">
          <a href={`#${uploadAnchorId}`}>Go to upload</a>
        </Button>
      </div>
    );
  }

  if (source.urlImport) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            try {
              const response = await fetch("/api/v1/import-jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: source.importType ?? "WEBSITE",
                  sourceUrl: url.trim(),
                }),
              });
              const json: unknown = await response.json();
              if (!response.ok) {
                throw new Error(
                  typeof json === "object" &&
                    json !== null &&
                    "error" in json &&
                    typeof (json as { error?: { message?: string } }).error
                      ?.message === "string"
                    ? (json as { error: { message: string } }).error.message
                    : "Import failed",
                );
              }
              toast.success(`${source.label} import started`);
              setUrl("");
              onImported?.();
              router.refresh();
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Import failed",
              );
            }
          });
        }}
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-4"
      >
        <div className="space-y-2">
          <Label htmlFor={`import-url-${source.id}`}>
            {source.label} public link
          </Label>
          <Input
            id={`import-url-${source.id}`}
            type="url"
            required
            placeholder={source.placeholder}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <p className="text-xs text-[var(--muted-foreground)]">
            {source.urlHint ??
              (source.id === "notion"
                ? "Share → Publish to web, then paste the public URL."
                : source.id === "google-docs"
                  ? "File → Share → Publish to web, then paste the link."
                  : "We import readable public page text to train your Twin.")}
          </p>
        </div>
        <Button type="submit" disabled={isPending}>
          Import from {source.label}
        </Button>
        {source.id === "linkedin" ||
        source.id === "notion" ||
        source.id === "google-docs" ? (
          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <p className="text-sm font-medium">
              Or paste text {source.id === "linkedin" ? "(recommended for LinkedIn)" : ""}
            </p>
            <Input
              placeholder="Title (optional)"
              value={pasteTitle}
              onChange={(event) => setPasteTitle(event.target.value)}
            />
            <Textarea
              placeholder={
                source.id === "linkedin"
                  ? "Paste your LinkedIn About, headline, and experience…"
                  : "Paste the page content you want your Twin to learn…"
              }
              className="min-h-[120px]"
              value={pasteText}
              onChange={(event) => setPasteText(event.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={isPastePending}
              onClick={() => {
                startPasteTransition(async () => {
                  try {
                    await importPastedText(`${source.label} import`);
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Import failed",
                    );
                  }
                });
              }}
            >
              Import pasted text
            </Button>
          </div>
        ) : null}
      </form>
    );
  }

  return null;
}

export function ConnectSourcesMarketingCta() {
  return (
    <Button asChild size="sm" className="mt-4">
      <Link href={ROUTES.signup}>Connect sources — start free</Link>
    </Button>
  );
}
