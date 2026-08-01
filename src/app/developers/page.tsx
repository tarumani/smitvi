import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
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
    <div className="min-h-full">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
            Public API
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
            Build on Smitvi
          </h1>
          <p className="mt-4 text-[var(--muted-foreground)]">
            Use API keys to ask your Knowledge Twin, list processed sources, and
            integrate human intelligence into your products. Pro or Business
            required.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={ROUTES.apiKeysSettings}>Manage API keys</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={ROUTES.pricing}>View plans</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          {examples.map((example) => (
            <GlassCard key={example.title} className="p-5">
              <h2 className="font-display text-lg font-semibold">
                {example.title}
              </h2>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--background)] p-4 text-xs leading-relaxed text-[var(--foreground)] ring-1 ring-[var(--border)]">
                <code>{example.code}</code>
              </pre>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="mt-8 space-y-2 p-5 text-sm text-[var(--muted-foreground)]">
          <p>
            Base path: <code className="text-[var(--foreground)]">/api/public/v1</code>
          </p>
          <p>
            Auth: <code className="text-[var(--foreground)]">Authorization: Bearer smv_…</code>
          </p>
          <p>
            Scopes: <code className="text-[var(--foreground)]">twin:ask</code>,{" "}
            <code className="text-[var(--foreground)]">knowledge:read</code>
          </p>
          <p>CORS is enabled for browser clients. Rate limits apply per key owner.</p>
        </GlassCard>
      </main>
      <SiteFooter />
    </div>
  );
}
