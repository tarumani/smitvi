/** Curated network modules when live data is sparse (S2 Network Home). */

export type DemoOpenQuestion = {
  question: string;
  topic: string;
  ownerUsername: string;
  ownerDisplayName: string;
};

export type DemoSuccessStory = {
  quote: string;
  name: string;
  role: string;
  username: string;
  metric: string;
};

export type DemoTopEarner = {
  username: string;
  displayName: string;
  headline: string;
  earningsLabel: string;
};

export type DemoCommunity = {
  name: string;
  memberCount: number;
  topic: string;
};

export type DemoHiringCompany = {
  name: string;
  role: string;
  skill: string;
};

export type DemoPopularConversation = {
  title: string;
  hubUsername: string;
  hubDisplayName: string;
  replyCount: number;
};

export const DEMO_OPEN_QUESTIONS: DemoOpenQuestion[] = [
  {
    question: "Who can review our RAG architecture before launch?",
    topic: "AI product",
    ownerUsername: "maya.chen",
    ownerDisplayName: "Maya Chen",
  },
  {
    question: "Looking for a UX expert in healthcare onboarding",
    topic: "UX · Healthcare",
    ownerUsername: "lena.park",
    ownerDisplayName: "Lena Park",
  },
  {
    question: "Need a staff engineer to stress-test system design docs",
    topic: "System design",
    ownerUsername: "arjun.rao",
    ownerDisplayName: "Arjun Rao",
  },
  {
    question: "Best framework for turning research notes into a public Twin?",
    topic: "Knowledge Twin",
    ownerUsername: "sofia.martinez",
    ownerDisplayName: "Sofia Martinez",
  },
];

export const DEMO_SUCCESS_STORIES: DemoSuccessStory[] = [
  {
    quote:
      "My Intelligence Hub answers client FAQs while I sleep — consults booked from Twin chat alone.",
    name: "Noah Okonkwo",
    role: "Founder coach",
    username: "noah.okonkwo",
    metric: "12 consults / month",
  },
  {
    quote:
      "Published one knowledge pack; marketplace sales now cover my Pro plan twice over.",
    name: "Arjun Rao",
    role: "Staff engineer",
    username: "arjun.rao",
    metric: "$480 net / month",
  },
];

export const DEMO_TOP_EARNERS: DemoTopEarner[] = [
  {
    username: "maya.chen",
    displayName: "Maya Chen",
    headline: "AI product architect",
    earningsLabel: "₹42,000",
  },
  {
    username: "arjun.rao",
    displayName: "Arjun Rao",
    headline: "Distributed systems",
    earningsLabel: "₹28,500",
  },
  {
    username: "noah.okonkwo",
    displayName: "Noah Okonkwo",
    headline: "Founder coach",
    earningsLabel: "₹19,200",
  },
];

export const DEMO_COMMUNITIES: DemoCommunity[] = [
  { name: "AI Product Builders", memberCount: 1280, topic: "RAG & launches" },
  { name: "Indie Experts", memberCount: 940, topic: "Monetize knowledge" },
  { name: "Healthcare UX", memberCount: 620, topic: "Research twins" },
];

export const DEMO_COMPANIES_HIRING: DemoHiringCompany[] = [
  {
    name: "Northline Health",
    role: "Clinical educator Twin",
    skill: "Medical education",
  },
  {
    name: "Atlas Robotics",
    role: "Field applications expert",
    skill: "Drone systems",
  },
  {
    name: "Meridian Labs",
    role: "Security review Twin",
    skill: "AppSec",
  },
];

export const DEMO_POPULAR_CONVERSATIONS: DemoPopularConversation[] = [
  {
    title: "How do you price a first consultation offer?",
    hubUsername: "noah.okonkwo",
    hubDisplayName: "Noah Okonkwo",
    replyCount: 48,
  },
  {
    title: "What belongs in a public vs private knowledge library?",
    hubUsername: "maya.chen",
    hubDisplayName: "Maya Chen",
    replyCount: 36,
  },
  {
    title: "Trade-offs for multi-tenant RAG on Postgres",
    hubUsername: "arjun.rao",
    hubDisplayName: "Arjun Rao",
    replyCount: 29,
  },
];

export const DEMO_LATEST_INTELLIGENCE: Array<{
  id: string;
  title: string;
  summary: string;
  ownerUsername: string;
  ownerDisplayName: string;
  topics: string[];
}> = [
  {
    id: "demo-k1",
    title: "Confidence gates for production Twins",
    summary: "When to say I don't know — patterns from live expert deployments.",
    ownerUsername: "maya.chen",
    ownerDisplayName: "Maya Chen",
    topics: ["AI product", "Safety"],
  },
  {
    id: "demo-k2",
    title: "Interview system design pack",
    summary: "Staff-level trade-off notes with diagrams and follow-up questions.",
    ownerUsername: "arjun.rao",
    ownerDisplayName: "Arjun Rao",
    topics: ["System design"],
  },
  {
    id: "demo-k3",
    title: "Climate policy brief Q&A library",
    summary: "Cited answers from memos and public research summaries.",
    ownerUsername: "sofia.martinez",
    ownerDisplayName: "Sofia Martinez",
    topics: ["Climate policy"],
  },
];
