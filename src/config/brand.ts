/**
 * SMITVI brand & product language (Human Intelligence OS).
 * Approved architecture — Sprint 1.
 */

export const APP_NAME = "Smitvi" as const;

export const APP_VISION =
  "Create the world's first Human Intelligence Operating System." as const;

export const APP_MISSION =
  "Help one billion people build digital businesses around their knowledge." as const;

export const APP_TAGLINE_LINES = [
  "Own Your Intelligence.",
  "Grow Your Influence.",
  "Earn While You Sleep.",
] as const;

/** Single-line tagline for metadata and compact UI. */
export const APP_TAGLINE = APP_TAGLINE_LINES.join(" ");

/** Primary outcome hook — every surface should reinforce monetization. */
export const APP_OUTCOME = "Earn money from what you know." as const;

export const INTELLIGENCE_HUB_LABEL = "Intelligence Hub" as const;

export const TRAIN_TWIN_LABEL = "Train Your AI Twin" as const;

export const TRAIN_TWIN_NAV_SHORT = "Train Twin" as const;

/** Onboarding archetypes (Sprint 3+ UI). */
export const HUB_ARCHETYPES = [
  { id: "AI_MENTOR", label: "AI Mentor" },
  { id: "AI_TEACHER", label: "AI Teacher" },
  { id: "AI_DESIGNER", label: "AI Designer" },
  { id: "AI_DEVELOPER", label: "AI Developer" },
  { id: "AI_CONSULTANT", label: "AI Consultant" },
  { id: "AI_COACH", label: "AI Coach" },
  { id: "AI_CREATOR", label: "AI Creator" },
  { id: "AI_RESEARCHER", label: "AI Researcher" },
  { id: "BUSINESS", label: "Business" },
  { id: "OTHER", label: "Other" },
] as const;

export type HubArchetypeId = (typeof HUB_ARCHETYPES)[number]["id"];

/** Five platform pillars (IA reference). */
export const PLATFORM_PILLARS = [
  "Identity",
  "Intelligence",
  "Audience",
  "Marketplace",
  "Business",
] as const;

/** Unique blurbs for About / editorial surfaces (avoid duplicate pillar copy). */
export const PLATFORM_PILLAR_DETAILS = [
  {
    name: "Identity",
    summary:
      "Your @username, profile, archetype, and public reputation — the durable home for everything you publish.",
  },
  {
    name: "Intelligence",
    summary:
      "Sources, Human Intelligence Graph, and Twin chat with citations so answers stay grounded in what you own.",
  },
  {
    name: "Audience",
    summary:
      "Discover, search, and recommendations that help the right visitors find your hub by skill and evidence.",
  },
  {
    name: "Marketplace",
    summary:
      "Consultations, knowledge packs, courses, and subscriptions tied to the same identity visitors already trust.",
  },
  {
    name: "Business",
    summary:
      "Inbox, leads, analytics, and billing so expertise can run as an operation — not only as one-off replies.",
  },
] as const;

/** Creator levels (reputation — later sprints). */
export const CREATOR_LEVELS = [
  "Explorer",
  "Creator",
  "Professional",
  "Expert",
  "Master",
  "Legend",
] as const;

/** Feature litmus test before building. */
export const PRODUCT_LITMUS_QUESTION =
  "Does this help users grow, monetize, or scale their intelligence?" as const;
