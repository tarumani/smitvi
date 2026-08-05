# SMITVI — Human Intelligence Operating System

**Status:** Approved (implementation in progress)  
**Category:** HI-OS — not social, not ChatGPT clone, not generic marketplace.

## Brand

- **Tagline:** Own Your Intelligence. Grow Your Influence. Earn While You Sleep.
- **Vision:** The world's first Human Intelligence Operating System.
- **Mission:** Help one billion people build digital businesses around their knowledge.
- **Litmus:** Does this help users grow, monetize, or scale their intelligence?

## Core concept

Every person owns an **Intelligence Hub** — a living AI system that learns, grows, earns, and improves. Public URL: `smitvi.com/@username`.

## Five pillars

1. **Identity** — portfolio, experience, skills, verification, reputation  
2. **Intelligence** — knowledge, memory, reasoning, documents, projects  
3. **Audience** — followers, subscribers, communities, notifications  
4. **Marketplace** — templates, courses, consultations, subscriptions, downloads  
5. **Business** — analytics, revenue, leads, bookings, payments  

## Information architecture (target)

| Area | Routes |
|------|--------|
| Network home | `/` (never empty) |
| Creator workspace | `/hub/dashboard`, `/hub/intelligence`, … |
| Public hub | `/@username`, `/@username/chat` |
| Legacy (compat) | `/dashboard`, `/knowledge`, … |
| Onboarding | `/onboarding` → archetype → connect → `/build` → `/celebrate` |

See full blueprint in product approval chat (IA, flows, schema, API, 52-week roadmap).

## Sprint plan (first 12 weeks)

| Sprint | Focus |
|--------|--------|
| S1 | Brand, docs, `/hub/*` aliases | Done |
| S2 | Network Home v1 (curated, never empty) | Done |
| S3 | Onboarding archetype picker |
| S4 | Connect sources + ImportJob schema |
| S5 | Build animation + celebrate |
| S6 | Intelligence Hub public tabs |
| S7 | Business dashboard cards |
| S8 | Unified leads / business inbox |
| S9 | Reputation scores v1 |
| S10 | Semantic search MVP |
| S11 | Template + prompt pack SKUs |
| S12 | Import PDF + website |

## Technical stack

Next.js, TypeScript, Tailwind, shadcn, Supabase Auth, Prisma, PostgreSQL, pgvector, OpenAI, Fly.io, Stripe, Razorpay.

## Code references

- Brand constants: `src/config/brand.ts`
- Routes: `src/config/constants.ts` (`ROUTES.hub`, `ROUTES.dashboard`, …)
