export const APP_NAME = "Smitvi" as const;
export const APP_TAGLINE = "The Global Human Intelligence Network" as const;
/** Primary user outcome — reinforce across product UI. */
export const APP_OUTCOME = "Earn money from what you know." as const;
export const TRAIN_TWIN_LABEL = "Train Your AI Twin" as const;
/** Shorter label for compact nav (mobile). */
export const TRAIN_TWIN_NAV_SHORT = "Train Twin" as const;
/** Canonical production origin (also set NEXT_PUBLIC_APP_URL in deploy env). */
export const PRODUCTION_APP_URL = "https://smitvi.com" as const;

/** Human labels for marketplace listing product types. */
export const MARKETPLACE_LISTING_TYPE_LABELS = {
  CONSULTATION: "Consultation",
  KNOWLEDGE_PACK: "Knowledge pack",
  EXPERT_SUBSCRIPTION: "Expert subscription",
  SERVICE_PACKAGE: "Service package",
  COURSE: "Course",
} as const;

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  authCallback: "/auth/callback",
  dashboard: "/dashboard",
  knowledge: "/knowledge",
  twinChat: "/chat",
  inbox: "/inbox",
  inboxConversation: (id: string) => `/inbox/${id}` as const,
  search: "/search",
  discover: "/discover",
  howItHelps: "/how-it-helps",
  pricing: "/pricing",
  marketplace: "/marketplace",
  marketplaceSell: "/marketplace/sell",
  marketplaceOrders: "/marketplace/orders",
  billingSettings: "/settings/billing",
  profileSettings: "/settings/profile",
  passwordSettings: "/settings/password",
  apiKeysSettings: "/settings/api-keys",
  consultationSettings: "/settings/consultations",
  developers: "/developers",
  onboarding: "/onboarding",
  admin: "/admin",
  adminUsers: "/admin/users",
  adminTwins: "/admin/twins",
  adminKnowledge: "/admin/knowledge",
  adminModeration: "/admin/moderation",
  organizations: "/orgs",
  organizationNew: "/orgs/new",
  organization: (slug: string) => `/orgs/${slug}` as const,
  organizationMembers: (slug: string) => `/orgs/${slug}/members` as const,
  organizationKnowledge: (slug: string) => `/orgs/${slug}/knowledge` as const,
  organizationChat: (slug: string) => `/orgs/${slug}/chat` as const,
  organizationInvite: (token: string) => `/orgs/invite/${token}` as const,
  publicProfile: (username: string) => `/@${username}` as const,
  publicTwinChat: (username: string) => `/@${username}/chat` as const,
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
