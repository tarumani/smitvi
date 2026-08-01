import { DemoSection } from "@/components/landing/demo-section";
import { ExpertsSection } from "@/components/landing/experts-section";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProductSection } from "@/components/landing/product-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <DemoSection />
        <ProductSection />
        <HowItWorks />
        <ExpertsSection />
      </main>
      <SiteFooter />
    </div>
  );
}
