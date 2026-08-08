"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ForYouFeed,
  IntelligenceMapNode,
  IntelligenceMapPayload,
} from "@/domain/recommendations/types";
import {
  ForYouFeedSkeleton,
  RecommendationSection,
} from "@/components/recommendations/recommendation-card";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/config/constants";

type ApiResponse = {
  data?: { forYou?: ForYouFeed };
  error?: { message?: string };
};

export function ForYouFeed() {
  const [feed, setFeed] = useState<ForYouFeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommendations");
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) {
        throw new Error(data.error?.message ?? "Failed to load");
      }
      if (data.data?.forYou) setFeed(data.data.forYou);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <ForYouFeedSkeleton />;
  if (error) {
    return (
      <GlassCard className="p-6 text-sm text-red-400">
        {error}
        <Button variant="ghost" className="ml-2" onClick={() => void load()}>
          Retry
        </Button>
      </GlassCard>
    );
  }
  if (!feed) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            For You
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Discovery powered by your Human Intelligence Graph — every item
            includes a reason.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.intelligenceGraph}>Intelligence map</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <RecommendationSection
          title="People you should know"
          items={feed.peopleYouShouldKnow}
          empty="Train your graph with skills and projects to unlock expert matches."
        />
        <RecommendationSection
          title="Knowledge for you"
          items={feed.knowledgeForYou}
        />
        <RecommendationSection
          title="Skills to explore"
          items={feed.skillsToExplore}
        />
        <RecommendationSection
          title="People you could collaborate with"
          items={feed.collaborators}
        />
        <RecommendationSection
          title="Opportunities for you"
          items={feed.opportunities}
        />
        <RecommendationSection
          title="Trending in your expertise"
          items={feed.trendingInExpertise}
        />
      </div>

      {feed.learningGaps.length > 0 ? (
        <GlassCard className="p-5">
          <h3 className="font-display text-lg font-semibold">Learning gaps</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {feed.learningGaps.map((g) => (
              <li key={g.skillOrTopic} className="border-l-2 border-[var(--accent)] pl-3">
                <p className="font-semibold">{g.skillOrTopic}</p>
                <p className="text-[var(--muted-foreground)]">{g.whyItMatters}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Try: {g.suggestedLearning.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}
    </div>
  );
}

const FILTER_MAP: Record<string, (n: IntelligenceMapNode) => boolean> = {
  skills: (n) => n.type === "SKILL",
  projects: (n) => n.type === "PROJECT",
  experience: (n) =>
    n.type === "COMPANY" || n.type === "PROFESSION" || n.type === "EDUCATION",
  knowledge: (n) => n.type === "KNOWLEDGE" || n.type === "DOCUMENT",
  industries: (n) => n.type === "INDUSTRY",
  technologies: (n) => n.type === "TECHNOLOGY" || n.type === "TOOL",
  companies: (n) => n.type === "COMPANY",
  people: (n) => n.type === "PERSON",
  topics: (n) => n.type === "TOPIC",
};

function layoutRadial(
  nodes: IntelligenceMapNode[],
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const cx = width / 2;
  const cy = height / 2;
  const positions = new Map<string, { x: number; y: number }>();
  const center = nodes.find((n) => n.level === 0);
  if (center) positions.set(center.id, { x: cx, y: cy });

  const l1 = nodes.filter((n) => n.level === 1);
  const l2 = nodes.filter((n) => n.level === 2);

  l1.forEach((n, i) => {
    const angle = (i / Math.max(l1.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positions.set(n.id, {
      x: cx + Math.cos(angle) * 140,
      y: cy + Math.sin(angle) * 140,
    });
  });

  l2.forEach((n, i) => {
    const angle = (i / Math.max(l2.length, 1)) * Math.PI * 2;
    positions.set(n.id, {
      x: cx + Math.cos(angle) * 240,
      y: cy + Math.sin(angle) * 240,
    });
  });

  return positions;
}

export function IntelligenceMapView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [map, setMap] = useState<IntelligenceMapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    () => new Set(Object.keys(FILTER_MAP)),
  );
  const [expandL2, setExpandL2] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<unknown>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ px: number; py: number; tx: number; ty: number } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/intelligence-map");
      const data = (await res.json()) as {
        data?: { map?: IntelligenceMapPayload };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(data.error?.message ?? "Failed");
      setMap(data.data?.map ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleNodes = useMemo(() => {
    if (!map) return [];
    return map.nodes.filter((n) => {
      if (n.level === 0) return true;
      if (n.level === 2 && !expandL2) return false;
      for (const [key, fn] of Object.entries(FILTER_MAP)) {
        if (activeFilters.has(key) && fn(n)) return true;
      }
      return false;
    });
  }, [map, activeFilters, expandL2]);

  const visibleIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes],
  );

  const edges = useMemo(
    () =>
      map?.edges.filter(
        (e) => visibleIds.has(e.source) && visibleIds.has(e.target),
      ) ?? [],
    [map, visibleIds],
  );

  const positions = useMemo(
    () => layoutRadial(visibleNodes, 520, 420),
    [visibleNodes],
  );

  const selected = visibleNodes.find((n) => n.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void fetch(`/api/intelligence-map/nodes/${encodeURIComponent(selectedId)}`)
      .then((r) => r.json())
      .then((d: { data?: { detail?: unknown } }) => setDetail(d.data?.detail ?? null))
      .catch(() => setDetail(null));
  }, [selectedId]);

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform((t) => ({ ...t, k: Math.min(2.5, Math.max(0.4, t.k * delta)) }));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = {
      px: e.clientX,
      py: e.clientY,
      tx: transform.x,
      ty: transform.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setTransform((t) => ({
      ...t,
      x: drag.current!.tx + (e.clientX - drag.current!.px),
      y: drag.current!.ty + (e.clientY - drag.current!.py),
    }));
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  if (loading) return <ForYouFeedSkeleton />;
  if (error) {
    return (
      <GlassCard className="p-6 text-sm text-red-400">
        {error}
        <Button variant="ghost" onClick={() => void load()}>
          Retry
        </Button>
      </GlassCard>
    );
  }
  if (!map || map.nodes.length === 0) {
    return (
      <GlassCard className="p-6 text-sm text-[var(--muted-foreground)]">
        No graph nodes yet — complete your profile and train your Twin.
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <GlassCard className="overflow-hidden p-2">
        <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-2 pb-2">
          {Object.keys(FILTER_MAP).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleFilter(key)}
              className={`rounded-full px-2.5 py-0.5 text-xs capitalize ${
                activeFilters.has(key)
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "bg-[var(--surface)] text-[var(--muted)]"
              }`}
            >
              {key}
            </button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto h-7 text-xs"
            onClick={() => setExpandL2((v) => !v)}
          >
            {expandL2 ? "Collapse outer ring" : "Expand outer ring"}
          </Button>
        </div>
        <svg
          ref={svgRef}
          viewBox="0 0 520 420"
          className="h-[420px] w-full touch-none select-none"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <g
            transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}
          >
            {edges.map((e) => {
              const a = positions.get(e.source);
              const b = positions.get(e.target);
              if (!a || !b) return null;
              return (
                <line
                  key={e.id}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="var(--border)"
                  strokeWidth={1}
                  opacity={0.7}
                />
              );
            })}
            {visibleNodes.map((n) => {
              const p = positions.get(n.id);
              if (!p) return null;
              const r = n.level === 0 ? 22 : n.level === 1 ? 14 : 10;
              const fill =
                n.level === 0
                  ? "var(--accent)"
                  : n.level === 1
                    ? "var(--accent-soft)"
                    : "var(--surface)";
              return (
                <g
                  key={n.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(n.id)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    fill={fill}
                    stroke={
                      selectedId === n.id ? "var(--accent)" : "var(--border)"
                    }
                    strokeWidth={selectedId === n.id ? 2 : 1}
                  />
                  <text
                    x={p.x}
                    y={p.y + r + 12}
                    textAnchor="middle"
                    className="fill-[var(--foreground)] text-[9px]"
                  >
                    {n.label.length > 18
                      ? `${n.label.slice(0, 16)}…`
                      : n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        <p className="px-2 pb-2 text-xs text-[var(--muted)]">
          Scroll to zoom · drag to pan · click a node for details
        </p>
      </GlassCard>

      <GlassCard className="p-4 text-sm">
        <h3 className="font-semibold">Node details</h3>
        {!selected ? (
          <p className="mt-2 text-[var(--muted-foreground)]">
            Select a node to inspect relationships and evidence.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="font-medium">{selected.label}</p>
            <p className="text-xs text-[var(--muted)]">{selected.type}</p>
            {selected.description ? (
              <p className="text-[var(--muted-foreground)]">
                {selected.description}
              </p>
            ) : null}
            {selected.confidence != null ? (
              <p className="text-xs">
                Confidence: {Math.round(selected.confidence * 100)}%
              </p>
            ) : null}
            {detail && typeof detail === "object" ? (
              <pre className="max-h-48 overflow-auto rounded bg-[var(--surface)] p-2 text-[10px] text-[var(--muted-foreground)]">
                {JSON.stringify(detail, null, 2)}
              </pre>
            ) : null}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
