export type GuideSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type GuidePost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  keywords: string[];
  sections: GuideSection[];
};

/**
 * First-party editorial guides for AdSense / SEO readiness.
 * Keep these original, practical, and free of scraped third-party copy.
 */
export const GUIDE_POSTS: GuidePost[] = [
  {
    slug: "what-is-a-knowledge-twin",
    title: "What is a Knowledge Twin — and why it is not a generic chatbot",
    description:
      "A practical definition of Knowledge Twins: AI assistants grounded in one expert’s sources, with citations, limits, and a path to human help.",
    publishedAt: "2026-08-01",
    updatedAt: "2026-08-09",
    readingMinutes: 9,
    keywords: ["knowledge twin", "AI twin", "grounded AI", "expert AI"],
    sections: [
      {
        heading: "The short definition",
        paragraphs: [
          "A Knowledge Twin is an AI assistant trained primarily on one person’s (or team’s) published knowledge — notes, documents, FAQs, decks, and other sources they control — rather than on the open web. When you ask it a question, it should retrieve from that library, answer in the expert’s voice and framing, and show which sources it used. When the library does not cover the topic, a well-designed Twin refuses to invent an answer.",
          "That last point matters. Most chat products optimize for always answering. A Knowledge Twin optimizes for trustworthy answering: useful when evidence exists, honest when it does not. Smitvi builds this pattern into every Intelligence Hub so visitors can learn from real expertise without mistaking autocomplete for authority.",
        ],
      },
      {
        heading: "How a Twin differs from a general chatbot",
        paragraphs: [
          "General chatbots are trained on broad corpora. They are excellent for brainstorming, drafting, and explaining common knowledge. They are weak when you need a specific expert’s frameworks, client patterns, or unpublished operating manuals — and they rarely tell you that the answer is outside their evidence.",
          "A Knowledge Twin flips the default. The retrieval set is intentionally narrow: the expert’s uploads and connections. That makes answers more relevant for domain work and less likely to blend in unrelated internet advice. It also creates a clear commercial boundary: the Twin can handle repeatable questions while the human takes paid consultations for judgment calls.",
        ],
        bullets: [
          "Scope: one expert’s library vs the entire web",
          "Accountability: answers can cite sources the expert chose to publish",
          "Failure mode: “I don’t know from my sources” instead of confident hallucination",
          "Handoff: escalate to bookings, marketplace offers, or inbox when stakes rise",
        ],
      },
      {
        heading: "When a Twin is the right tool",
        paragraphs: [
          "Use a Twin when the same questions arrive every week — onboarding FAQs, methodology explainers, portfolio walkthroughs, product heuristics, research summaries. If you have already written the answer once in a doc, the Twin can deliver it with consistency while you sleep.",
          "Do not use a Twin as a substitute for regulated advice, medical diagnosis, legal representation, or one-off strategy that depends on confidential context the Twin was never given. Good hubs state those limits in the bio and Twin greeting so visitors set correct expectations.",
        ],
      },
      {
        heading: "What “good” looks like for visitors",
        paragraphs: [
          "A high-quality public Twin experience includes a clear headline, an original bio written by the expert, at least one substantial public knowledge source, visible topics or skills, and chat that cites sources when it answers. Thin profiles with a pasted LinkedIn dump and no commentary feel empty to users — and to advertising review systems that look for unique value.",
          "On Smitvi, creators control visibility: private sources stay out of public search and public chat. That separation is part of the product promise — own your intelligence, decide what is discoverable, and still keep a private workspace for drafts.",
        ],
      },
      {
        heading: "How Smitvi implements the idea",
        paragraphs: [
          "Smitvi is a Human Intelligence Operating System: Identity (your @username hub), Intelligence (graph + Twin), Audience (Discover and search), Marketplace (sell packs and services), and Business (analytics, leads, subscriptions). The Twin sits at the center of the Intelligence pillar, but it only works if Identity and content quality are real.",
          "If you are evaluating Twins as a visitor, prefer hubs that show original writing, clear expertise boundaries, and source-backed answers. If you are building one, start with a focused library — ten solid documents beat a hundred shallow imports — then expand once chat quality is stable.",
        ],
      },
    ],
  },
  {
    slug: "train-your-ai-twin-without-copying-the-internet",
    title: "How to train your AI Twin without dumping low-value copied content",
    description:
      "A source-selection playbook for Smitvi creators: prefer original notes, add commentary to imports, and keep public hubs AdSense- and visitor-safe.",
    publishedAt: "2026-08-02",
    updatedAt: "2026-08-09",
    readingMinutes: 10,
    keywords: ["train AI twin", "knowledge sources", "content quality"],
    sections: [
      {
        heading: "Start from work you already own",
        paragraphs: [
          "The strongest Twin training set is material you created in the course of real work: workshop outlines, client FAQs (anonymized), research memos, design critiques, code architecture notes, teaching curricula, and post-mortems. These artifacts carry voice, judgment, and structure that generic web pages lack.",
          "Importing a public webpage or a résumé dump can help bootstrap, but it is rarely enough on its own. Advertising networks and human visitors both look for added value — commentary, organization, examples, and clear authorship. If a page is mostly content copied from elsewhere with no transformation, do not make it the centerpiece of a public hub.",
        ],
      },
      {
        heading: "A simple source quality checklist",
        paragraphs: [
          "Before you mark a source public, ask whether a stranger would learn something specific from it that they could not get from a generic search result. If the answer is no, keep it private or rewrite it into an original guide.",
        ],
        bullets: [
          "You wrote most of the words, or you substantially curated and explained third-party material",
          "Examples are concrete (projects, constraints, trade-offs) rather than vague slogans",
          "Sensitive client data is removed or generalized",
          "The document has a clear topic so retrieval can find it later",
          "You would be comfortable putting your name on the page",
        ],
      },
      {
        heading: "How to handle LinkedIn, Notion, and web imports",
        paragraphs: [
          "Imports are accelerators, not finished public pages. After connecting LinkedIn, Notion, Docs, GitHub, or a website, open the extracted text and edit. Add a short “how I use this” intro, trim boilerplate, and split giant dumps into focused notes. That curation step is what turns raw material into a Twin people trust.",
          "For third-party articles you did not write, prefer summarizing the idea in your own words and linking out, rather than republishing the full text. If you must keep a long excerpt for private retrieval, leave it private so it never appears as a public content screen next to ads.",
        ],
      },
      {
        heading: "Minimum viable public hub",
        paragraphs: [
          "For Discover and review quality, aim for: a unique display name and headline, an original 2–3 paragraph bio, a profile photo, three or more public sources with distinct topics, and Twin chat tested with five real questions from your audience. Then enable public chat.",
          "Resist the urge to publish an empty shell “to claim the username.” Incomplete hubs hurt network trust and can look like low-value pages to crawlers. Finish the content bar first; growth mechanics second.",
        ],
      },
      {
        heading: "Ongoing maintenance",
        paragraphs: [
          "After launch, review Twin inbox transcripts weekly. When the Twin misses, add a source or clarify an existing note — do not paste random web articles to “fill gaps.” Quality compounds when each new upload answers a real failure mode you observed.",
          "Quarterly, archive outdated advice and update pricing or consultation boundaries. A Twin that cites obsolete guidance is worse than a Twin that admits uncertainty.",
        ],
      },
    ],
  },
  {
    slug: "monetize-expertise-with-twin-plus-human",
    title: "Monetize expertise without burnout: Twin for FAQs, humans for judgment",
    description:
      "A practical monetization model for experts: let your Twin deflect repetitive questions while consultations and marketplace offers capture high-value work.",
    publishedAt: "2026-08-03",
    updatedAt: "2026-08-09",
    readingMinutes: 8,
    keywords: ["monetize expertise", "consultations", "knowledge marketplace"],
    sections: [
      {
        heading: "Separate leverage work from judgment work",
        paragraphs: [
          "Experts burn out when every question requires a live reply. The Twin-plus-human model splits demand into two lanes. Leverage work is repeatable: definitions, process overviews, tool comparisons you have already documented. Judgment work is contextual: prioritization, diagnosis, negotiation, and decisions under uncertainty.",
          "Price and productize accordingly. The Twin and free public chat attract attention and qualify interest. Paid consultations, knowledge packs, and subscriptions monetize depth. Visitors who only need a FAQ never consume your calendar; visitors who need you still have a clear path to book.",
        ],
      },
      {
        heading: "Offer ladder that usually works",
        paragraphs: [
          "Start simple. One free public Twin, one paid consultation type, and one digital offer (a checklist, template pack, or recorded workshop). Measure which questions convert to bookings. Then expand listings only where demand is proven.",
        ],
        bullets: [
          "Free: public Twin chat with citations and clear limits",
          "Low ticket: guides, templates, or prompt packs on the marketplace",
          "Mid ticket: 30–60 minute consultations with a defined outcome",
          "High ticket: retainers or expert subscriptions for ongoing access",
        ],
      },
      {
        heading: "Write offers like a practitioner, not a hype page",
        paragraphs: [
          "Marketplace copy should describe deliverables, audience, prerequisites, and what is out of scope. Avoid exaggerated income claims and empty buzzwords. Specificity converts better and keeps the network aligned with quality guidelines used by payment and advertising partners.",
          "Tie each listing back to your hub so buyers can inspect your Twin and bio before purchasing. Trust is the product packaging.",
        ],
      },
      {
        heading: "Operations that keep evenings free",
        paragraphs: [
          "Set office hours for consultations. Use Twin greetings to steer common questions to a public FAQ source. Route “I need a custom plan” messages to a booking form. Review analytics monthly: which sources drive chat, which listings sell, which topics create support load.",
          "The goal is not to automate your entire profession. The goal is to stop retyping the same paragraph while still being available for the work only you can do.",
        ],
      },
    ],
  },
  {
    slug: "build-an-intelligence-hub-that-people-trust",
    title: "Build an Intelligence Hub people trust: identity, evidence, and boundaries",
    description:
      "Trust checklist for public Smitvi hubs — original bio, evidence-backed Twin answers, transparent limits, and navigation that helps visitors act.",
    publishedAt: "2026-08-04",
    updatedAt: "2026-08-09",
    readingMinutes: 9,
    keywords: ["intelligence hub", "expert profile", "trust"],
    sections: [
      {
        heading: "Identity comes before intelligence",
        paragraphs: [
          "Visitors decide in seconds whether a hub is real. Use a consistent @username, a recognizable photo, a headline that names your domain, and a bio written in complete sentences about who you help and how. Placeholder text, emoji walls, or bios copied from another platform signal low effort.",
          "If you operate under a studio or company name, say so. Clarify whether the Twin speaks for you personally or for a team knowledge base. Ambiguity breaks trust faster than a short bio.",
        ],
      },
      {
        heading: "Evidence is the product",
        paragraphs: [
          "Projects, case studies, curricula, and annotated frameworks are evidence. A wall of buzzwords is not. Publish a few deep pieces rather than dozens of thin stubs. When the Twin answers, citations should point to those pieces so visitors can verify the reasoning path.",
          "For regulated or sensitive domains, add an explicit disclaimer on the hub and keep high-risk sources private. Direct people to book a consultation when a question needs licensed advice.",
        ],
      },
      {
        heading: "Boundaries visitors can understand",
        paragraphs: [
          "State what the Twin will not do. Examples: no medical diagnosis, no legal filings, no confidential deal advice in public chat, no guaranteed outcomes. Boundaries reduce misuse and show professionalism.",
          "Also set interaction boundaries: response style, language, and when to escalate to a human. A Twin that tries to please every prompt becomes noisy; a Twin with a charter becomes useful.",
        ],
      },
      {
        heading: "Navigation and next steps",
        paragraphs: [
          "A trustworthy hub makes the next action obvious: ask the Twin, browse the store, or request a consultation. Do not bury contact paths. Include a way to report abuse or reach the Smitvi team for policy issues — platform trust is part of personal trust.",
          "Revisit your hub on a mobile device. If the first screen is only a login wall or an empty state, fix content and layout before sharing the link widely.",
        ],
      },
    ],
  },
  {
    slug: "grounded-ai-vs-hallucination",
    title: "Grounded AI vs hallucination: how to evaluate expert answers at work",
    description:
      "A buyer’s guide to checking citations, refusal quality, and when to hire a human — written for teams using expert Twins on Smitvi.",
    publishedAt: "2026-08-05",
    updatedAt: "2026-08-09",
    readingMinutes: 8,
    keywords: ["grounded AI", "hallucination", "citations", "AI evaluation"],
    sections: [
      {
        heading: "Why fluency is not reliability",
        paragraphs: [
          "Modern models produce fluent text even when evidence is missing. In professional settings, fluency without grounding creates false confidence: a polished wrong answer travels farther than a rough correct one. Grounded systems reduce that risk by constraining retrieval and exposing sources.",
          "When you evaluate an expert Twin, ignore charming tone for a moment. Ask whether each material claim can be traced to a document the expert published, and whether the Twin admits gaps.",
        ],
      },
      {
        heading: "A five-question evaluation script",
        paragraphs: [
          "Use the same script across hubs so you can compare quality fairly.",
        ],
        bullets: [
          "Ask a question clearly inside the expert’s stated domain — does the answer cite sources?",
          "Ask a borderline question slightly outside the domain — does the Twin refuse or hedge honestly?",
          "Ask for a step-by-step process you already know — does it match the expert’s published method?",
          "Ask for confidential or regulated advice — does it decline and point to a human consult?",
          "Ask the same question twice — is the core guidance stable, not randomly reinvented?",
        ],
      },
      {
        heading: "Red flags",
        paragraphs: [
          "Watch for answers that invent case studies, quote statistics without sources, ignore your constraints, or contradict the expert’s own bio. Also be wary of hubs with almost no original writing — if the profile is empty, the Twin has little trustworthy material to retrieve.",
          "Marketplace purchases deserve the same scrutiny. Prefer listings that describe deliverables and link to a mature hub over listings that only promise outcomes.",
        ],
      },
      {
        heading: "When to stop chatting and book a human",
        paragraphs: [
          "Book a consultation when the decision is expensive, irreversible, regulated, or dependent on private context the Twin does not have. Use the Twin to prepare: clarify vocabulary, gather options, and write the brief you will bring to the call.",
          "That workflow — learn with grounding, decide with a human — is how teams get leverage from expert AI without outsourcing accountability.",
        ],
      },
    ],
  },
  {
    slug: "human-intelligence-os-explained",
    title: "Human Intelligence OS explained: identity, graph, audience, marketplace, business",
    description:
      "An original overview of Smitvi’s five pillars and how they help experts turn knowledge into a durable digital business.",
    publishedAt: "2026-08-06",
    updatedAt: "2026-08-09",
    readingMinutes: 9,
    keywords: ["human intelligence OS", "Smitvi pillars", "creator business"],
    sections: [
      {
        heading: "Why “operating system” language",
        paragraphs: [
          "An operating system coordinates resources so applications can run reliably. A Human Intelligence OS coordinates an expert’s identity, knowledge graph, distribution, commerce, and operations so their expertise can run as a product — not only as live labor.",
          "Smitvi’s bet is that the next layer of the internet is not more anonymous content; it is structured human intelligence you can search, chat with, and hire. The five pillars below are how that system is organized.",
        ],
      },
      {
        heading: "Identity",
        paragraphs: [
          "Identity is your public @username, profile, archetype, and reputation surface. Without a durable identity, knowledge is trapped in inboxes and slide decks. With it, every Twin answer, listing, and consultation reinforces the same professional presence.",
        ],
      },
      {
        heading: "Intelligence",
        paragraphs: [
          "Intelligence is the Human Intelligence Graph plus Twin chat: sources in, structured entities and relationships, retrieval with citations out. This pillar is where private drafts and public teaching materials become queryable assets instead of static files.",
        ],
      },
      {
        heading: "Audience",
        paragraphs: [
          "Audience is Discover, search, recommendations, and sharing. Experts should not have to rebuild distribution from zero on every platform. A network that indexes skills and evidence helps the right visitors find the right hub.",
        ],
      },
      {
        heading: "Marketplace",
        paragraphs: [
          "Marketplace turns attention into transactions: consultations, packs, courses, and subscriptions tied to the same identity. Commerce without identity is a listing farm; identity without commerce leaves experts stuck in goodwill-only work.",
        ],
      },
      {
        heading: "Business",
        paragraphs: [
          "Business covers analytics, leads, inbox, billing, and the operating rhythms that keep a knowledge practice alive. The litmus test for new features on Smitvi is simple: does this help users grow, monetize, or scale their intelligence?",
          "If you are just starting, do not try to activate every pillar on day one. Claim Identity, load a focused Intelligence library, publish, then layer Audience and Marketplace as quality improves. Business tooling becomes meaningful once you have real conversations and orders to manage.",
        ],
      },
    ],
  },
];

export function listGuides(): GuidePost[] {
  return [...GUIDE_POSTS].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1,
  );
}

export function getGuideBySlug(slug: string): GuidePost | undefined {
  return GUIDE_POSTS.find((post) => post.slug === slug);
}

export function getGuideSlugs(): string[] {
  return GUIDE_POSTS.map((post) => post.slug);
}
