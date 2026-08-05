import {
  DEMO_COMMUNITIES,
  DEMO_COMPANIES_HIRING,
  DEMO_LATEST_INTELLIGENCE,
  DEMO_OPEN_QUESTIONS,
  DEMO_POPULAR_CONVERSATIONS,
  DEMO_SUCCESS_STORIES,
  DEMO_TOP_EARNERS,
} from "@/config/network-home-demo";
import {
  DEMO_NEW_EXPERTS,
  DEMO_TRENDING_EXPERTS,
  DEMO_TRENDING_TOPICS,
} from "@/config/demo-content";
import type { PrismaMarketplaceRepository } from "@/infrastructure/database/repositories/marketplace-repository";
import type { PrismaSearchRepository } from "@/infrastructure/database/repositories/search-repository";
import { formatInrFromMinorUnits } from "@/lib/format-money";

export type NetworkExpertCard = {
  username: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  followersCount?: number;
};

export type NetworkTopicCard = {
  topic: string;
  sourceCount: number;
};

export type NetworkKnowledgeCard = {
  id: string;
  title: string;
  summary: string | null;
  ownerUsername: string;
  ownerDisplayName: string;
  topics: string[];
};

export type NetworkQuestionCard = {
  question: string;
  topic: string;
  ownerUsername: string;
  ownerDisplayName: string;
};

export type NetworkEarnerCard = {
  username: string;
  displayName: string;
  headline: string | null;
  earningsLabel: string;
};

export type NetworkHomeViewModel = {
  hasLiveExperts: boolean;
  hasLiveCreators: boolean;
  hasLiveTopics: boolean;
  hasLiveKnowledge: boolean;
  hasLiveQuestions: boolean;
  hasLiveEarners: boolean;
  trendingExperts: NetworkExpertCard[];
  topCreators: NetworkExpertCard[];
  trendingTopics: NetworkTopicCard[];
  latestIntelligence: NetworkKnowledgeCard[];
  openQuestions: NetworkQuestionCard[];
  topEarners: NetworkEarnerCard[];
  successStories: typeof DEMO_SUCCESS_STORIES;
  communities: typeof DEMO_COMMUNITIES;
  companiesHiring: typeof DEMO_COMPANIES_HIRING;
  popularConversations: typeof DEMO_POPULAR_CONVERSATIONS;
};

export class GetNetworkHome {
  constructor(
    private readonly search: PrismaSearchRepository,
    private readonly marketplace: PrismaMarketplaceRepository,
  ) {}

  async execute(): Promise<NetworkHomeViewModel> {
    const [
      liveTrending,
      liveCreators,
      liveTopics,
      liveKnowledge,
      liveQuestions,
      liveEarners,
    ] = await Promise.all([
      this.search.trendingExperts(6),
      this.search.newExperts(6),
      this.search.trendingTopics(8),
      this.search.latestPublicKnowledge(6),
      this.search.networkOpenQuestions(6),
      this.marketplace.topEarners(5),
    ]);

    const hasLiveExperts = liveTrending.length > 0;
    const hasLiveCreators = liveCreators.length > 0;
    const hasLiveTopics = liveTopics.length > 0;
    const hasLiveKnowledge = liveKnowledge.length > 0;
    const hasLiveQuestions = liveQuestions.length > 0;
    const hasLiveEarners = liveEarners.length > 0;

    const trendingExperts: NetworkExpertCard[] = hasLiveExperts
      ? liveTrending.map((e) => ({
          username: e.username,
          displayName: e.displayName,
          headline: e.headline,
          avatarUrl: e.avatarUrl,
          followersCount: e.followersCount,
        }))
      : DEMO_TRENDING_EXPERTS.map((e) => ({
          username: e.username,
          displayName: e.displayName,
          headline: e.headline,
          avatarUrl: null,
        }));

    const topCreators: NetworkExpertCard[] =
      liveCreators.length > 0
        ? liveCreators.map((e) => ({
            username: e.username,
            displayName: e.displayName,
            headline: e.headline,
            avatarUrl: e.avatarUrl,
          }))
        : DEMO_NEW_EXPERTS.map((e) => ({
            username: e.username,
            displayName: e.displayName,
            headline: e.headline,
            avatarUrl: null,
          }));

    const trendingTopics: NetworkTopicCard[] = hasLiveTopics
      ? liveTopics
      : DEMO_TRENDING_TOPICS;

    const latestIntelligence: NetworkKnowledgeCard[] = hasLiveKnowledge
      ? liveKnowledge
      : DEMO_LATEST_INTELLIGENCE.map((k) => ({
          id: k.id,
          title: k.title,
          summary: k.summary,
          ownerUsername: k.ownerUsername,
          ownerDisplayName: k.ownerDisplayName,
          topics: k.topics,
        }));

    const openQuestions: NetworkQuestionCard[] = hasLiveQuestions
      ? liveQuestions
      : DEMO_OPEN_QUESTIONS;

    const topEarners: NetworkEarnerCard[] = hasLiveEarners
      ? liveEarners.map((e) => ({
          username: e.username,
          displayName: e.displayName,
          headline: e.headline,
          earningsLabel: formatInrFromMinorUnits(e.netEarningsCents),
        }))
      : DEMO_TOP_EARNERS.map((e) => ({
          username: e.username,
          displayName: e.displayName,
          headline: e.headline,
          earningsLabel: e.earningsLabel,
        }));

    return {
      hasLiveExperts,
      hasLiveCreators,
      hasLiveTopics,
      hasLiveKnowledge,
      hasLiveQuestions,
      hasLiveEarners,
      trendingExperts,
      topCreators,
      trendingTopics,
      latestIntelligence,
      openQuestions,
      topEarners,
      successStories: DEMO_SUCCESS_STORIES,
      communities: DEMO_COMMUNITIES,
      companiesHiring: DEMO_COMPANIES_HIRING,
      popularConversations: DEMO_POPULAR_CONVERSATIONS,
    };
  }
}
