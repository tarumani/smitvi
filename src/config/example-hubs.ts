/** Showcase Intelligence Hubs — used when live profiles are not published yet. */

export type ExampleHub = {
  slug: string;
  username: string;
  displayName: string;
  headline: string;
  bio: string;
  topics: string[];
  knowledgeHighlights: Array<{ title: string; summary: string }>;
  sampleQuestions: string[];
};

export const EXAMPLE_HUBS: ExampleHub[] = [
  {
    slug: "maya-chen",
    username: "maya.chen",
    displayName: "Maya Chen",
    headline: "AI product architect · Knowledge systems",
    bio: "I help teams ship grounded AI products — retrieval design, confidence gates, and Twin launch playbooks from a decade in production ML.",
    topics: ["AI product", "RAG & citations", "Knowledge Twins"],
    knowledgeHighlights: [
      {
        title: "Confidence gates for production Twins",
        summary: "When to say “I don’t know” — patterns from live expert deployments.",
      },
      {
        title: "RAG scope checklist",
        summary: "What belongs in public vs private libraries before you go live.",
      },
    ],
    sampleQuestions: [
      "How should we scope sources before enabling public Twin chat?",
      "What retrieval metrics matter in the first 30 days?",
    ],
  },
  {
    slug: "arjun-rao",
    username: "arjun.rao",
    displayName: "Arjun Rao",
    headline: "Staff engineer · Distributed systems",
    bio: "System design notes, interview libraries, and architecture reviews — packaged so your team can ask trade-off questions anytime.",
    topics: ["System design", "Distributed systems", "Security reviews"],
    knowledgeHighlights: [
      {
        title: "Interview system design pack",
        summary: "Staff-level trade-off notes with diagrams and follow-up questions.",
      },
    ],
    sampleQuestions: [
      "How would you stress-test this sharding plan?",
      "What failure modes are we missing in this diagram?",
    ],
  },
  {
    slug: "sofia-martinez",
    username: "sofia.martinez",
    displayName: "Sofia Martinez",
    headline: "Climate policy advisor · Research twin",
    bio: "Research memos and briefs turned into a cited Q&A Twin — clear boundaries on what is sourced vs interpretive.",
    topics: ["Climate policy", "Research & policy"],
    knowledgeHighlights: [
      {
        title: "Climate policy brief Q&A library",
        summary: "Cited answers from memos and public research summaries.",
      },
    ],
    sampleQuestions: [
      "Summarize the trade-offs in this briefing note.",
      "Which sources support this emissions claim?",
    ],
  },
  {
    slug: "noah-okonkwo",
    username: "noah.okonkwo",
    displayName: "Noah Okonkwo",
    headline: "Founder coach · Go-to-market playbooks",
    bio: "Go-to-market frameworks, pricing consults, and FAQ handling — my Twin covers repeat questions while I take high-judgment calls.",
    topics: ["Founder coaching", "Go-to-market", "Expert marketplace"],
    knowledgeHighlights: [
      {
        title: "First consultation offer playbook",
        summary: "Pricing, positioning, and what to publish on your public hub.",
      },
    ],
    sampleQuestions: [
      "How do I price a first consultation offer?",
      "What should my public Twin answer vs defer to me?",
    ],
  },
  {
    slug: "lena-park",
    username: "lena.park",
    displayName: "Lena Park",
    headline: "UX researcher · Interview libraries",
    bio: "Interview repositories and synthesis methods for product teams — ask about study design without digging through Notion.",
    topics: ["UX research", "Design & UX", "Healthcare onboarding"],
    knowledgeHighlights: [
      {
        title: "Healthcare onboarding research kit",
        summary: "Personas, interview guides, and synthesis templates.",
      },
    ],
    sampleQuestions: [
      "Which probes work best for onboarding discovery?",
      "How do we document insights for a public Twin safely?",
    ],
  },
  {
    slug: "dev-kapoor",
    username: "dev.kapoor",
    displayName: "Dev Kapoor",
    headline: "Security engineer · Threat modeling",
    bio: "Threat models, review checklists, and AppSec FAQs for teams shipping fast without skipping basics.",
    topics: ["Security reviews", "AppSec", "Engineering"],
    knowledgeHighlights: [
      {
        title: "Threat modeling starter pack",
        summary: "STRIDE prompts and review gates for new services.",
      },
    ],
    sampleQuestions: [
      "What belongs in a lightweight threat model for this API?",
      "How do we redact secrets before uploading sources?",
    ],
  },
  {
    slug: "amira-hassan",
    username: "amira.hassan",
    displayName: "Amira Hassan",
    headline: "Medical educator · Clinical notes twin",
    bio: "Teaching scripts and clinical education content with strict source boundaries — for learners, not diagnosis.",
    topics: ["Medical education", "Education & health"],
    knowledgeHighlights: [
      {
        title: "Clinical teaching FAQ library",
        summary: "Curated explanations with citations to approved course material.",
      },
    ],
    sampleQuestions: [
      "Explain this pathway using only our syllabus sources.",
      "What topics should stay off the public Twin?",
    ],
  },
];

const bySlug = new Map(EXAMPLE_HUBS.map((hub) => [hub.slug, hub]));
const byUsername = new Map(EXAMPLE_HUBS.map((hub) => [hub.username, hub]));

export function getExampleHubBySlug(slug: string): ExampleHub | undefined {
  return bySlug.get(slug);
}

export function getExampleHubByUsername(
  username: string,
): ExampleHub | undefined {
  return byUsername.get(username);
}
