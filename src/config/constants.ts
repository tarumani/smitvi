export {
  APP_NAME,
  APP_VISION,
  APP_MISSION,
  APP_TAGLINE,
  APP_TAGLINE_LINES,
  APP_OUTCOME,
  INTELLIGENCE_HUB_LABEL,
  TRAIN_TWIN_LABEL,
  TRAIN_TWIN_NAV_SHORT,
  HUB_ARCHETYPES,
  PLATFORM_PILLARS,
  CREATOR_LEVELS,
  PRODUCT_LITMUS_QUESTION,
} from "@/config/brand";
export type { HubArchetypeId } from "@/config/brand";

/** Canonical production origin (also set NEXT_PUBLIC_APP_URL in deploy env). */
export const PRODUCTION_APP_URL = "https://smitvi.com" as const;

/** Human labels for marketplace listing product types. */
export const MARKETPLACE_LISTING_TYPE_LABELS = {
  CONSULTATION: "Consultation",
  KNOWLEDGE_PACK: "Knowledge pack",
  EXPERT_SUBSCRIPTION: "Expert subscription",
  SERVICE_PACKAGE: "Service package",
  TEMPLATE: "Template",
  PROMPT_PACK: "Prompt pack",
  COURSE: "Course",
} as const;

export const ONBOARDING_STEPS = [
  "archetype",
  "profile",
  "connect",
  "build",
  "celebrate",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  authCallback: "/auth/callback",
  /** @deprecated Prefer ROUTES.hub.dashboard — kept for bookmarks and emails */
  dashboard: "/dashboard",
  /** @deprecated Prefer ROUTES.hub.intelligence */
  knowledge: "/knowledge",
  hub: {
    root: "/hub",
    dashboard: "/hub/dashboard",
    intelligence: "/hub/intelligence",
    audience: "/hub/audience",
    marketplace: "/hub/marketplace",
    consultations: "/hub/consultations",
    analytics: "/hub/analytics",
    settings: "/hub/settings",
    leads: "/hub/leads",
    invite: "/hub/invite",
  },
  twinChat: "/chat",
  inbox: "/inbox",
  inboxConversation: (id: string) => `/inbox/${id}` as const,
  search: "/search",
  discover: "/discover",
  howItHelps: "/how-it-helps",
  pricing: "/pricing",
  about: "/about",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  disclaimer: "/disclaimer",
  exampleHub: (slug: string) => `/examples/hubs/${slug}` as const,
  exampleListing: (id: string) => `/examples/listings/${id}` as const,
  productTrainTwin: "/product/train-your-twin",
  productTwinChat: "/product/twin-chat",
  productConsultations: "/product/consultations",
  productMarketplace: "/product/marketplace",
  marketplace: "/marketplace",
  marketplaceSell: "/marketplace/sell",
  marketplaceOrders: "/marketplace/orders",
  billingSettings: "/settings/billing",
  profileSettings: "/settings/profile",
  passwordSettings: "/settings/password",
  apiKeysSettings: "/settings/api-keys",
  consultationSettings: "/settings/consultations",
  /** Opens dashboard launch wizard on Book step */
  consultationSetup: "/hub/dashboard?launch=book",
  /** Opens dashboard launch wizard on Sell step */
  marketplaceSellFirst: "/hub/dashboard?launch=monetize",
  /** Dashboard launch wizard — optional step focus */
  launchDashboard: (step?: string) =>
    step
      ? `${ROUTES.hub.dashboard}?launch=${step}`
      : `${ROUTES.hub.dashboard}#launch-wizard`,
  developers: "/developers",
  onboarding: "/onboarding",
  onboardingArchetype: "/onboarding/archetype",
  onboardingProfile: "/onboarding/profile",
  onboardingConnect: "/onboarding/connect",
  onboardingBuild: "/onboarding/build",
  onboardingCelebrate: "/onboarding/celebrate",
  admin: "/admin",
  adminUsers: "/admin/users",
  adminTwins: "/admin/twins",
  adminKnowledge: "/admin/knowledge",
  adminModeration: "/admin/moderation",
  adminGrowth: "/admin/growth",
  organizations: "/orgs",
  organizationNew: "/orgs/new",
  organization: (slug: string) => `/orgs/${slug}` as const,
  organizationMembers: (slug: string) => `/orgs/${slug}/members` as const,
  organizationKnowledge: (slug: string) => `/orgs/${slug}/knowledge` as const,
  organizationChat: (slug: string) => `/orgs/${slug}/chat` as const,
  organizationInvite: (token: string) => `/orgs/invite/${token}` as const,
  publicProfile: (username: string) => `/@${username}` as const,
  publicTwinChat: (username: string) => `/@${username}/chat` as const,
  publicTwinChatWithPrompt: (username: string, question: string) =>
    `/@${username}/chat?q=${encodeURIComponent(question)}` as const,
  share: (token: string) => `/share/${token}` as const,
} as const;

export const BUSINESS_ORG_SEAT_LIMIT = 25;

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 80;
export const BIO_MAX = 500;
export const HEADLINE_MAX = 160;

export const FREE_AI_CHATS_PER_DAY = 5;
export const MARKETPLACE_COMMISSION_RATE = 0.2;

export const PROTECTED_PATH_PREFIXES = [
  "/hub",
  "/dashboard",
  "/knowledge",
  "/chat",
  "/inbox",
  "/settings",
  "/onboarding",
  "/admin",
  "/marketplace/sell",
  "/marketplace/orders",
  "/orgs",
] as const;

export const AUTH_PATH_PREFIXES = ["/login", "/signup"] as const;
