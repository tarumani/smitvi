import { DemoSection } from "@/components/landing/demo-section";
import { ExpertsSection } from "@/components/landing/experts-section";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProductSection } from "@/components/landing/product-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <DemoSection />
      <ProductSection />
      <HowItWorks />
      <ExpertsSection />
    </>
  );
}
