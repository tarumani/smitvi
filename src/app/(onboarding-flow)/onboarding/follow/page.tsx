import { container } from "@/application/container";
import { OnboardingFollowClient } from "@/components/onboarding/onboarding-follow-client";

export default async function OnboardingFollowPage() {
  const experts = await container.search.trendingExperts();
  const list = experts.slice(0, 10).map((e) => ({
    username: e.username,
    displayName: e.displayName,
    headline: e.headline,
    avatarUrl: e.avatarUrl,
  }));

  return <OnboardingFollowClient experts={list} />;
}
