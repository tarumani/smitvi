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
import { AskTwin } from "@/application/chat/ask-twin";
import { CreateSubscriptionCheckout } from "@/application/billing/create-subscription-checkout";
import { CreateMarketplaceCheckout } from "@/application/billing/create-marketplace-checkout";
import { HandleStripeWebhook } from "@/application/billing/handle-stripe-webhook";
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
import { PrismaConsultationRepository } from "@/infrastructure/database/repositories/consultation-repository";
import { PrismaImportJobRepository } from "@/infrastructure/database/repositories/import-job-repository";
import { PrismaGraphRepository } from "@/infrastructure/database/repositories/graph-repository";
import { GraphService } from "@/application/graph/graph-service";
import { SyncProfileToGraph } from "@/application/graph/sync-profile-to-graph";
import { ExtractGraphFromKnowledge } from "@/application/graph/extract-graph-from-knowledge";
import { ProcessGraphJob } from "@/application/graph/process-graph-job";
import { BackfillUserGraphs } from "@/application/graph/backfill-user-graphs";
import { UnifiedSearchService } from "@/application/search/unified-search-service";

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
  askTwin: new AskTwin(knowledge, conversations),
  createSubscriptionCheckout: new CreateSubscriptionCheckout(billing),
  createMarketplaceCheckout: new CreateMarketplaceCheckout(marketplace, billing),
  handleStripeWebhook: new HandleStripeWebhook(billing, marketplace, auditLogs),
  handleRazorpayWebhook: new HandleRazorpayWebhook(
    billing,
    marketplace,
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
  unifiedSearch: new UnifiedSearchService(graphService, search),
};
