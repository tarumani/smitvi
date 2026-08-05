/** Showcase content shown when the live network is still empty. */

export type DemoExpert = {
  username: string;
  displayName: string;
  headline: string;
  avatarSeed: string;
};

export type DemoTopic = {
  topic: string;
  sourceCount: number;
};

export type DemoListing = {
  id: string;
  type: "CONSULTATION" | "KNOWLEDGE_PACK" | "COURSE";
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  seller: {
    displayName: string;
    username: string;
    avatarSeed: string;
  };
};

export const DEMO_TRENDING_EXPERTS: DemoExpert[] = [
  {
    username: "maya.chen",
    displayName: "Maya Chen",
    headline: "AI product architect · Knowledge systems",
    avatarSeed: "Maya Chen",
  },
  {
    username: "arjun.rao",
    displayName: "Arjun Rao",
    headline: "Staff engineer · Distributed systems",
    avatarSeed: "Arjun Rao",
  },
  {
    username: "sofia.martinez",
    displayName: "Sofia Martinez",
    headline: "Climate policy advisor · Research twin",
    avatarSeed: "Sofia Martinez",
  },
  {
    username: "noah.okonkwo",
    displayName: "Noah Okonkwo",
    headline: "Founder coach · Go-to-market playbooks",
    avatarSeed: "Noah Okonkwo",
  },
];

export const DEMO_NEW_EXPERTS: DemoExpert[] = [
  {
    username: "lena.park",
    displayName: "Lena Park",
    headline: "UX researcher · Interview libraries",
    avatarSeed: "Lena Park",
  },
  {
    username: "dev.kapoor",
    displayName: "Dev Kapoor",
    headline: "Security engineer · Threat modeling",
    avatarSeed: "Dev Kapoor",
  },
  {
    username: "amira.hassan",
    displayName: "Amira Hassan",
    headline: "Medical educator · Clinical notes twin",
    avatarSeed: "Amira Hassan",
  },
];

export const DEMO_TRENDING_TOPICS: DemoTopic[] = [
  { topic: "Knowledge Twins", sourceCount: 42 },
  { topic: "System design", sourceCount: 38 },
  { topic: "AI product strategy", sourceCount: 31 },
  { topic: "RAG & citations", sourceCount: 27 },
  { topic: "Expert marketplace", sourceCount: 24 },
  { topic: "Career coaching", sourceCount: 19 },
  { topic: "Climate policy", sourceCount: 16 },
  { topic: "Security reviews", sourceCount: 14 },
];

/** Domain lanes used on Discover to help people browse by intent. */
export const DEMO_DISCOVER_DOMAINS = [
  {
    key: "ai-product",
    title: "AI & product",
    description: "Twins trained on product strategy, RAG design, and launch playbooks.",
    query: "AI product",
  },
  {
    key: "engineering",
    title: "Engineering",
    description: "System design, security, and architecture knowledge you can ask anytime.",
    query: "system design",
  },
  {
    key: "research",
    title: "Research & policy",
    description: "Cited answers from research notes, briefs, and domain libraries.",
    query: "climate policy",
  },
  {
    key: "coaching",
    title: "Coaching & careers",
    description: "Founder, career, and interview guidance grounded in real frameworks.",
    query: "career coaching",
  },
  {
    key: "health-education",
    title: "Education & health",
    description: "Teaching and clinical knowledge Twins with clear source boundaries.",
    query: "medical education",
  },
  {
    key: "design",
    title: "Design & UX",
    description: "Research libraries, interview insights, and product design judgment.",
    query: "UX research",
  },
] as const;

export const DEMO_DISCOVER_GUIDES = [
  {
    title: "Find an expert Twin",
    body: "Search by skill or topic, then open public chat for grounded answers.",
    href: "/discover",
  },
  {
    title: "Ask with citations",
    body: "Every Twin reply can show the sources it used — or say “I don’t know.”",
    href: "/product/twin-chat",
  },
  {
    title: "Book a human when needed",
    body: "Use the Twin for FAQs, then hire the expert for decisions that need judgment.",
    href: "/product/consultations",
  },
] as const;

export const DEMO_MARKETPLACE_LISTINGS: DemoListing[] = [
  {
    id: "demo-listing-1",
    type: "CONSULTATION",
    title: "60-min AI product architecture review",
    description:
      "Walk through your Twin scope, retrieval plan, and confidence gates with a senior AI product architect.",
    priceCents: 14900,
    currency: "USD",
    seller: {
      displayName: "Maya Chen",
      username: "maya.chen",
      avatarSeed: "Maya Chen",
    },
  },
  {
    id: "demo-listing-2",
    type: "KNOWLEDGE_PACK",
    title: "Distributed systems interview pack",
    description:
      "A curated knowledge pack of trade-off notes, diagrams, and FAQs from real staff-level interviews.",
    priceCents: 4900,
    currency: "USD",
    seller: {
      displayName: "Arjun Rao",
      username: "arjun.rao",
      avatarSeed: "Arjun Rao",
    },
  },
  {
    id: "demo-listing-3",
    type: "COURSE",
    title: "Build a public Knowledge Twin in 7 days",
    description:
      "Step-by-step course: upload sources, tune answers, enable public chat, and publish your first offer.",
    priceCents: 9900,
    currency: "USD",
    seller: {
      displayName: "Noah Okonkwo",
      username: "noah.okonkwo",
      avatarSeed: "Noah Okonkwo",
    },
  },
  {
    id: "demo-listing-4",
    type: "CONSULTATION",
    title: "Climate brief Q&A office hours",
    description:
      "Ask a research Twin trained on policy memos, then book a live follow-up for decisions that need a human.",
    priceCents: 8900,
    currency: "USD",
    seller: {
      displayName: "Sofia Martinez",
      username: "sofia.martinez",
      avatarSeed: "Sofia Martinez",
    },
  },
];
