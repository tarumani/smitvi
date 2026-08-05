import { container } from "@/application/container";
import { ExpertsSection } from "@/components/landing/experts-section";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { NetworkHome } from "@/components/network/network-home";

export default async function HomePage() {
  const network = await container.getNetworkHome.execute();

  return (
    <>
      <Hero />
      <NetworkHome {...network} />
      <HowItWorks />
      <ExpertsSection />
    </>
  );
}
