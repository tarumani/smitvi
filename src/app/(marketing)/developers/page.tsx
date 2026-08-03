import type { Metadata } from "next";
import Link from "next/link";
import { Code2, KeyRound, Shield } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Developers",
  description: "Smitvi Public API — query Knowledge Twins programmatically.",
};

const examples = [
  {
    title: "Ask your Twin",
    code: `curl -X POST "$APP_URL/api/public/v1/twin/ask" \\
  -H "Authorization: Bearer smv_..." \\
  -H "Content-Type: application/json" \\
  -d '{"question":"What are my core topics?"}'`,
  },
  {
    title: "List knowledge",
    code: `curl "$APP_URL/api/public/v1/knowledge" \\
  -H "Authorization: Bearer smv_..."`,
  },
  {
    title: "Who am I",
    code: `curl "$APP_URL/api/public/v1/me" \\
  -H "Authorization: Bearer smv_..."`,
  },
] as const;

export default function DevelopersPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <PageHero
        eyebrow="Public API"
        title="Build on Smitvi"
        description="Use API keys to ask your Knowledge Twin, list processed sources, and integrate human intelligence into your products. Pro or Business required."
        actions={
          <>
            <Button asChild>
              <Link href={ROUTES.apiKeysSettings}>Manage API keys</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={ROUTES.pricing}>View plans</Link>
            </Button>
          </>
        }
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: KeyRound,
            title: "API keys",
            body: "Create scoped keys from Settings → API keys.",
          },
          {
            icon: Shield,
            title: "Auth header",
            body: "Authorization: Bearer smv_… on every request.",
          },
          {
            icon: Code2,
            title: "REST + CORS",
            body: "Browser-friendly endpoints under /api/public/v1.",
          },
        ].map((item, index) => (
          <GlassCard
            key={item.title}
            className={`p-5 ${index === 0 ? "animate-fade-up" : index === 1 ? "animate-fade-up-delay-1" : "animate-fade-up-delay-2"}`}
          >
            <item.icon className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 font-semibold">{item.title}</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {item.body}
            </p>
          </GlassCard>
        ))}
      </div>

      <div className="mt-12 space-y-4">
        {examples.map((example) => (
          <GlassCard key={example.title} className="p-6">
            <h2 className="font-display text-lg font-semibold">
              {example.title}
            </h2>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-[var(--background)]/80 p-4 text-xs leading-relaxed text-[var(--foreground)] ring-1 ring-[var(--border)]">
              <code>{example.code}</code>
            </pre>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-8 space-y-2 p-6 text-sm text-[var(--muted-foreground)]">
        <p>
          Base path:{" "}
          <code className="text-[var(--foreground)]">/api/public/v1</code>
        </p>
        <p>
          Scopes: <code className="text-[var(--foreground)]">twin:ask</code>,{" "}
          <code className="text-[var(--foreground)]">knowledge:read</code>
        </p>
        <p>Rate limits apply per key owner.</p>
      </GlassCard>
    </div>
  );
}
