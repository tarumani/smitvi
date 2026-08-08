"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search as SearchIcon } from "lucide-react";
import type { SearchCategory, UnifiedSearchResponse } from "@/domain/search/types";
import { ExpertResultCard } from "@/components/search/expert-result-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

const EXAMPLES = [
  "Find a healthcare UX designer",
  "Find a React developer for fintech",
  "Who can mentor me in Figma?",
  "Find experts similar to me",
];

const CATEGORIES: { id: SearchCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "people", label: "People" },
  { id: "knowledge", label: "Knowledge" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "topics", label: "Topics" },
];

type Props = {
  initialQuery?: string;
};

export function UnifiedSearchExperience({ initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchCategory>("all");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UnifiedSearchResponse | null>(null);
  const [suggestions, setSuggestions] = useState<
    Array<{ type: string; label: string }>
  >([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");

  const runSearch = useCallback(async (q: string, type: SearchCategory) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setData(null);
      setLastSearchedQuery("");
      return;
    }
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/search/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, type, limit: 20 }),
      });
      const body = (await res.json()) as {
        data?: UnifiedSearchResponse;
        error?: { message?: string };
      };
      if (res.ok && body.data) {
        setData(body.data);
        setLastSearchedQuery(trimmed.toLowerCase());
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery.length >= 2) {
      void runSearch(initialQuery, category);
    }
  }, [initialQuery, category, runSearch]);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (
      !inputFocused ||
      trimmed.length < 2 ||
      loading ||
      (data && lastSearchedQuery && trimmed === lastSearchedQuery)
    ) {
      if (!inputFocused || (lastSearchedQuery && trimmed === lastSearchedQuery)) {
        setSuggestions([]);
      }
      return;
    }
    const t = setTimeout(() => {
      void fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((j: { data?: { suggestions?: typeof suggestions } }) =>
          setSuggestions(j.data?.suggestions ?? []),
        )
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query, inputFocused, loading, lastSearchedQuery, data]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestions([]);
    setInputFocused(false);
    const params = new URLSearchParams({ q: query.trim() });
    window.history.replaceState(null, "", `/search?${params.toString()}`);
    void runSearch(query, category);
  };

  const showSuggestionDropdown =
    inputFocused &&
    suggestions.length > 0 &&
    !loading &&
    query.trim().toLowerCase() !== lastSearchedQuery;

  const recordOpen = (username: string) => {
    if (!query.trim()) return;
    void fetch("/api/search/success", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query.trim(),
        username,
        successType: "profile_open",
      }),
    });
  };

  const showExperts = category === "all" || category === "people";
  const showKnowledge = category === "all" || category === "knowledge";

  const empty = useMemo(() => {
    if (!data) return false;
    return (
      data.experts.length === 0 &&
      data.knowledge.length === 0 &&
      data.skills.length === 0
    );
  }, [data]);

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setInputFocused(false), 150);
          }}
          placeholder="Ask Smitvi to find someone…"
          className="h-12 border-[var(--glass-border)] bg-[var(--glass)] pr-[6.75rem] pl-11"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute top-1/2 right-1.5 h-9 -translate-y-1/2"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
        {showSuggestionDropdown ? (
          <GlassCard className="absolute z-10 mt-1 w-full p-2 shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--surface-elevated)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const next = s.label.replace(/ experts$/i, "");
                  setQuery(next);
                  setSuggestions([]);
                  setInputFocused(false);
                  const params = new URLSearchParams({ q: next });
                  window.history.replaceState(
                    null,
                    "",
                    `/search?${params.toString()}`,
                  );
                  void runSearch(next, category);
                }}
              >
                {s.label}
              </button>
            ))}
          </GlassCard>
        ) : null}
      </form>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setCategory(c.id);
              setSuggestions([]);
              if (query.length >= 2) void runSearch(query, c.id);
            }}
            className={
              category === c.id
                ? "rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]"
                : "rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]"
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="rounded-full border border-dashed border-[var(--border)] px-3 py-1 hover:border-[var(--accent)]"
            onClick={() => {
              setQuery(ex);
              setSuggestions([]);
              setInputFocused(false);
              void runSearch(ex, category);
            }}
          >
            {ex}
          </button>
        ))}
      </div>

      {data?.interpretedQuery ? (
        <p className="text-xs text-[var(--muted)]">
          Intent: {data.interpretedQuery.intent.replace(/_/g, " ").toLowerCase()}
          {data.interpretedQuery.entities.length
            ? ` · ${data.interpretedQuery.entities.map((e) => e.value).join(", ")}`
            : null}
        </p>
      ) : null}

      {empty && data?.knowledgeGap ? (
        <GlassCard className="p-6">
          <p className="font-medium">No exact expert found.</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {data.knowledgeGap.message}{" "}
            {data.knowledgeGap.partialCount
              ? `Here are experts matching ${data.knowledgeGap.satisfied.length} of ${data.knowledgeGap.satisfied.length + data.knowledgeGap.missing.length} criteria.`
              : null}
          </p>
          {data.knowledgeGap.missing.length ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Gap: {data.knowledgeGap.missing.join(", ")} not verified in graph
            </p>
          ) : null}
        </GlassCard>
      ) : null}

      {showExperts && data?.experts.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Experts</h2>
          {data.experts.map((expert) => (
            <ExpertResultCard
              key={expert.userId}
              expert={expert}
              query={query}
              onOpenProfile={recordOpen}
            />
          ))}
        </section>
      ) : null}

      {showExperts && data?.partialMatchExperts?.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Related experts</h2>
          {data.partialMatchExperts.map((expert) => (
            <ExpertResultCard
              key={expert.userId}
              expert={expert}
              query={query}
              onOpenProfile={recordOpen}
            />
          ))}
        </section>
      ) : null}

      {showKnowledge && data?.knowledge.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Knowledge</h2>
          {data.knowledge.map((k) => (
            <GlassCard key={k.id} className="p-4">
              <p className="font-medium">{k.title}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                @{k.ownerUsername}
              </p>
            </GlassCard>
          ))}
        </section>
      ) : null}
    </div>
  );
}
