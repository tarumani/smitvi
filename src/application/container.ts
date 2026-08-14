import { CreateProfile } from "@/application/profile/create-profile";
import { GetMyProfile } from "@/application/profile/get-my-profile";
import { UpdateProfile } from "@/application/profile/update-profile";
import { CompleteOnboarding } from "@/application/profile/complete-onboarding";
import { SaveOnboardingArchetype } from "@/application/onboarding/save-onboarding-archetype";
import { UpdateReputation } from "@/application/reputation/update-reputation";
import { CreateImportJob } from "@/application/import/create-import-job";
import { ProcessImportJob } from "@/application/import/process-import-job";
import { SyncAuthenticatedUser } from "@/application/auth/sync-authenticated-user";
import { UploadKnowledge } from "@/application/knowledge/upload-knowledge";
import { ProcessKnowledgeSource } from "@/application/knowledge/process-knowledge-source";
import { TwinInboxPushNotifier } from "@/application/notifications/twin-inbox-push-notifier";
import { SocialActivityPushNotifier } from "@/application/notifications/social-activity-push-notifier";
import { ConsultationRequestPushNotifier } from "@/application/notifications/consultation-request-push-notifier";
import { MarketplaceOrderPushNotifier } from "@/application/notifications/marketplace-order-push-notifier";
import { CreatorPayoutPushNotifier } from "@/application/notifications/creator-payout-push-notifier";
import { AskTwin } from "@/application/chat/ask-twin";
import { CreateSubscriptionCheckout } from "@/application/billing/create-subscription-checkout";
import { CreateMarketplaceCheckout } from "@/application/billing/create-marketplace-checkout";
import { HandleStripeWebhook } from "@/application/billing/handle-stripe-webhook";
import { ActivatePayPalSubscription } from "@/application/billing/activate-paypal-subscription";
import { HandleRazorpayWebhook } from "@/application/billing/handle-razorpay-webhook";
import { GetFollowingFeed } from "@/application/discover/get-following-feed";
import { GetNetworkHome } from "@/application/network/get-network-home";
import { CreateOrganization } from "@/application/organization/create-organization";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import { PrismaProfileRepository } from "@/infrastructure/database/repositories/profile-repository";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/user-repository";
import { PrismaKnowledgeRepository } from "@/infrastructure/database/repositories/knowledge-repository";
import { PrismaConversationRepository } from "@/infrastructure/database/repositories/conversation-repository";
import { PrismaSocialRepository } from "@/infrastructure/database/repositories/social-repository";
import { PrismaSearchRepository } from "@/infrastructure/database/repositories/search-repository";
import { PrismaBillingRepository } from "@/infrastructure/database/repositories/billing-repository";
import { PrismaMarketplaceRepository } from "@/infrastructure/database/repositories/marketplace-repository";
import { PrismaOrganizationRepository } from "@/infrastructure/database/repositories/organization-repository";
import { PrismaApiKeyRepository } from "@/infrastructure/database/repositories/api-key-repository";
import { PrismaPushDeviceRepository } from "@/infrastructure/database/repositories/push-device-repository";
import { PrismaTwinInboxReadRepository } from "@/infrastructure/database/repositories/twin-inbox-read-repository";
import { PrismaSocialActivityReadRepository } from "@/infrastructure/database/repositories/social-activity-read-repository";
import { PrismaConsultationRepository } from "@/infrastructure/database/repositories/consultation-repository";
import { PrismaImportJobRepository } from "@/infrastructure/database/repositories/import-job-repository";
import { PrismaGraphRepository } from "@/infrastructure/database/repositories/graph-repository";
import { GraphService } from "@/application/graph/graph-service";
import { SyncProfileToGraph } from "@/application/graph/sync-profile-to-graph";
import { ExtractGraphFromKnowledge } from "@/application/graph/extract-graph-from-knowledge";
import { ProcessGraphJob } from "@/application/graph/process-graph-job";
import { BackfillUserGraphs } from "@/application/graph/backfill-user-graphs";
import { UnifiedSearchService } from "@/application/search/unified-search-service";
import { IntelligenceMapService } from "@/application/recommendations/intelligence-map-service";
import { RecommendationAnalyticsService } from "@/application/recommendations/recommendation-analytics-service";
import { RecommendationService } from "@/application/recommendations/recommendation-service";
import { PlatformFeeService } from "@/application/monetization/platform-fee-service";
import { CreatorWalletService } from "@/application/monetization/creator-wallet-service";
import { MarketplaceEventService } from "@/application/monetization/marketplace-event-service";
import { MarketplaceRefundService } from "@/application/monetization/marketplace-refund-service";
import { ProviderPaymentRefundService } from "@/application/billing/provider-payment-refund-service";
import { MarketplaceGraphSyncService } from "@/application/monetization/marketplace-graph-sync-service";
import { MarketplaceFulfillmentService } from "@/application/monetization/marketplace-fulfillment-service";
import { ProductPublishService } from "@/application/monetization/product-publish-service";
import { MonetizationAnalyticsService } from "@/application/monetization/monetization-analytics-service";
import { TwinMonetizationService } from "@/application/monetization/twin-monetization-service";
import { GrowthAgentService } from "@/application/growth/growth-agent-service";
import { GrowthJobRunner } from "@/application/growth/growth-agent-service";
import { GrowthProspectService } from "@/application/growth/growth-prospect-service";
import { GrowthCampaignService } from "@/application/growth/growth-campaign-service";
import { GrowthMessageService } from "@/application/growth/growth-message-service";
import {
  GrowthAnalyticsService,
  GrowthReportService,
} from "@/application/growth/growth-report-service";
import { GrowthConversionService } from "@/application/growth/growth-conversion-service";
import { PortfolioAuditService } from "@/application/growth/portfolio-audit-service";
import { LibraryService, ReviewService } from "@/application/monetization/library-service";
import { TwinGraphRetriever } from "@/application/twin/twin-graph-retriever";
import { TwinMemoryService } from "@/application/twin/twin-memory-service";
import { TwinAnalyticsService } from "@/application/twin/twin-analytics-service";
import { TwinIntelligenceEngine } from "@/application/twin/twin-intelligence-engine";
import { TwinContextService } from "@/application/twin/twin-context-service";
import { TwinEvaluationService } from "@/application/twin/twin-evaluation-service";

const users = new PrismaUserRepository();
const profiles = new PrismaProfileRepository();
const auditLogs = new PrismaAuditLogRepository();
const knowledge = new PrismaKnowledgeRepository();
const conversations = new PrismaConversationRepository();
const social = new PrismaSocialRepository();
const search = new PrismaSearchRepository();
const billing = new PrismaBillingRepository();
const marketplace = new PrismaMarketplaceRepository();
const organizations = new PrismaOrganizationRepository();
const apiKeys = new PrismaApiKeyRepository();
const pushDevices = new PrismaPushDeviceRepository();
const twinInboxReads = new PrismaTwinInboxReadRepository();
const socialActivityReads = new PrismaSocialActivityReadRepository();
const consultations = new PrismaConsultationRepository();
const importJobs = new PrismaImportJobRepository();
const graphRepo = new PrismaGraphRepository();
const graphService = new GraphService(graphRepo);
const syncProfileToGraph = new SyncProfileToGraph(graphService, graphRepo);
const extractGraphFromKnowledge = new ExtractGraphFromKnowledge(
  graphService,
  graphRepo,
  knowledge,
);
const processGraphJob = new ProcessGraphJob(
  graphRepo,
  extractGraphFromKnowledge,
  syncProfileToGraph,
);
const processKnowledgeSource = new ProcessKnowledgeSource(
  knowledge,
  auditLogs,
  graphRepo,
  processGraphJob,
);
const processImportJob = new ProcessImportJob(
  importJobs,
  knowledge,
  processKnowledgeSource,
);

const unifiedSearch = new UnifiedSearchService(graphService, search);
const recommendationAnalytics = new RecommendationAnalyticsService();
const intelligenceMap = new IntelligenceMapService(graphService);
const recommendations = new RecommendationService(
  graphService,
  unifiedSearch,
  recommendationAnalytics,
);
const twinGraphRetriever = new TwinGraphRetriever(graphService);
const twinMemory = new TwinMemoryService(conversations);
const twinAnalytics = new TwinAnalyticsService();
const twinIntelligence = new TwinIntelligenceEngine(
  twinGraphRetriever,
  knowledge,
  profiles,
  twinMemory,
  recommendations,
  twinAnalytics,
);
const twinContext = new TwinContextService(
  graphService,
  profiles,
  twinIntelligence,
);
const twinEvaluation = new TwinEvaluationService();
const twinInboxPush = new TwinInboxPushNotifier(pushDevices, profiles);
const socialActivityPush = new SocialActivityPushNotifier(pushDevices, profiles);
const consultationRequestPush = new ConsultationRequestPushNotifier(pushDevices);
const marketplaceOrderPush = new MarketplaceOrderPushNotifier(
  pushDevices,
  profiles,
);
const creatorPayoutPush = new CreatorPayoutPushNotifier(pushDevices);

const platformFees = new PlatformFeeService();
const creatorWallet = new CreatorWalletService();
const marketplaceEvents = new MarketplaceEventService();
const marketplaceGraphSync = new MarketplaceGraphSyncService(graphService);
const marketplaceFulfillment = new MarketplaceFulfillmentService(
  marketplace,
  creatorWallet,
  marketplaceGraphSync,
  marketplaceEvents,
  marketplaceOrderPush,
);
const productPublish = new ProductPublishService(marketplace, marketplaceGraphSync);
const monetizationAnalytics = new MonetizationAnalyticsService(marketplace);
const twinMonetization = new TwinMonetizationService();
const library = new LibraryService();
const reviews = new ReviewService();
const marketplaceRefunds = new MarketplaceRefundService(
  creatorWallet,
  marketplaceEvents,
  new ProviderPaymentRefundService(),
  marketplaceOrderPush,
);
const growthJobRunner = new GrowthJobRunner(graphService);
const growthAgent = GrowthAgentService.create(graphService);
const growthProspects = new GrowthProspectService();
const growthCampaigns = new GrowthCampaignService();
const growthMessages = new GrowthMessageService();
const growthReports = new GrowthReportService();
const growthAnalytics = new GrowthAnalyticsService();
const growthConversions = new GrowthConversionService();
const portfolioAudit = new PortfolioAuditService();

export const container = {
  syncAuthenticatedUser: new SyncAuthenticatedUser(users, auditLogs),
  getMyProfile: new GetMyProfile(profiles),
  createProfile: new CreateProfile(profiles, auditLogs, syncProfileToGraph),
  updateProfile: new UpdateProfile(profiles, auditLogs, syncProfileToGraph),
  completeOnboarding: new CompleteOnboarding(profiles, auditLogs),
  saveOnboardingArchetype: new SaveOnboardingArchetype(profiles, auditLogs),
  updateReputation: new UpdateReputation(profiles, knowledge),
  createImportJob: new CreateImportJob(importJobs, processImportJob),
  uploadKnowledge: new UploadKnowledge(
    knowledge,
    processKnowledgeSource,
    auditLogs,
  ),
  processKnowledgeSource,
  askTwin: new AskTwin(
    knowledge,
    conversations,
    twinIntelligence,
    twinInboxPush,
  ),
  createSubscriptionCheckout: new CreateSubscriptionCheckout(billing),
  activatePayPalSubscription: new ActivatePayPalSubscription(billing, auditLogs),
  createMarketplaceCheckout: new CreateMarketplaceCheckout(marketplace, billing),
  handleStripeWebhook: new HandleStripeWebhook(
    billing,
    marketplace,
    marketplaceFulfillment,
    auditLogs,
  ),
  handleRazorpayWebhook: new HandleRazorpayWebhook(
    billing,
    marketplace,
    marketplaceFulfillment,
    auditLogs,
  ),
  createOrganization: new CreateOrganization(organizations, auditLogs),
  getNetworkHome: new GetNetworkHome(search, marketplace),
  getFollowingFeed: new GetFollowingFeed(),
  users,
  profiles,
  knowledge,
  conversations,
  social,
  search,
  billing,
  marketplace,
  organizations,
  apiKeys,
  pushDevices,
  twinInboxReads,
  socialActivityReads,
  twinInboxPush,
  socialActivityPush,
  consultationRequestPush,
  marketplaceOrderPush,
  creatorPayoutPush,
  consultations,
  importJobs,
  auditLogs,
  graph: graphService,
  graphRepo,
  syncProfileToGraph,
  processGraphJob,
  backfillUserGraphs: new BackfillUserGraphs(
    graphRepo,
    syncProfileToGraph,
    graphService,
  ),
  unifiedSearch,
  intelligenceMap,
  recommendationAnalytics,
  recommendations,
  twinAnalytics,
  twinContext,
  twinEvaluation,
  twinIntelligence,
  platformFees,
  creatorWallet,
  marketplaceFulfillment,
  productPublish,
  monetizationAnalytics,
  twinMonetization,
  library,
  reviews,
  marketplaceRefunds,
  marketplaceEvents,
  growthAgent,
  growthJobRunner,
  growthProspects,
  growthCampaigns,
  growthMessages,
  growthReports,
  growthAnalytics,
  growthConversions,
  portfolioAudit,
};
