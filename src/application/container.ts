import { CreateProfile } from "@/application/profile/create-profile";
import { GetMyProfile } from "@/application/profile/get-my-profile";
import { UpdateProfile } from "@/application/profile/update-profile";
import { SyncAuthenticatedUser } from "@/application/auth/sync-authenticated-user";
import { UploadKnowledge } from "@/application/knowledge/upload-knowledge";
import { ProcessKnowledgeSource } from "@/application/knowledge/process-knowledge-source";
import { AskTwin } from "@/application/chat/ask-twin";
import { CreateSubscriptionCheckout } from "@/application/billing/create-subscription-checkout";
import { CreateMarketplaceCheckout } from "@/application/billing/create-marketplace-checkout";
import { HandleStripeWebhook } from "@/application/billing/handle-stripe-webhook";
import { HandleRazorpayWebhook } from "@/application/billing/handle-razorpay-webhook";
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
const processKnowledgeSource = new ProcessKnowledgeSource(knowledge, auditLogs);

export const container = {
  syncAuthenticatedUser: new SyncAuthenticatedUser(users, auditLogs),
  getMyProfile: new GetMyProfile(profiles),
  createProfile: new CreateProfile(profiles, auditLogs),
  updateProfile: new UpdateProfile(profiles, auditLogs),
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
};
