"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { GlassCard } from "@/components/ui/glass-card";

type LibraryPayload = {
  access?: Array<{
    listing: { id: string; title: string; type: string };
    grantedAt: string;
  }>;
};

export default function CustomerLibraryPage() {
  const [library, setLibrary] = useState<LibraryPayload | null>(null);

  useEffect(() => {
    void fetch("/api/library")
      .then((r) => r.json())
      .then((d: { data?: { library?: LibraryPayload } }) =>
        setLibrary(d.data?.library ?? null),
      );
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Your library</h1>
      <GlassCard className="p-5">
        <h2 className="font-semibold">Purchased products</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(library?.access ?? []).length === 0 ? (
            <li className="text-[var(--muted-foreground)]">
              No purchases yet.{" "}
              <Link href={ROUTES.marketplace} className="text-[var(--accent)]">
                Browse marketplace
              </Link>
            </li>
          ) : (
            library?.access?.map((row) => (
              <li key={row.listing.id}>
                {row.listing.title}{" "}
                <span className="text-[var(--muted)]">({row.listing.type})</span>
              </li>
            ))
          )}
        </ul>
      </GlassCard>
    </div>
  );
}
