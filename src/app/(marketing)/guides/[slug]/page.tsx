import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticle } from "@/components/marketing/guide-article";
import { MarketingPageAtmosphere } from "@/components/marketing/marketing-page-atmosphere";
import { APP_NAME } from "@/config/constants";
import { getGuideBySlug, getGuideSlugs } from "@/content/guides";

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: "Guide" };
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    openGraph: {
      title: `${guide.title} · ${APP_NAME}`,
      description: guide.description,
      type: "article",
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  return (
    <div className="relative overflow-hidden">
      <MarketingPageAtmosphere />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <GuideArticle guide={guide} />
      </div>
    </div>
  );
}
