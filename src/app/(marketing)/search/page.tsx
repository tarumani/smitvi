import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { UnifiedSearchExperience } from "@/components/search/unified-search-experience";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Graph-powered expert discovery — find human intelligence by skills, industries, and evidence.",
};

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <PageHero
        eyebrow="Search"
        title="Find human intelligence"
        description="Graph relationships, semantic knowledge, and keyword discovery — combined with evidence you can verify."
      />
      <div className="mt-8">
        <UnifiedSearchExperience initialQuery={q.trim()} />
      </div>
    </div>
  );
}
