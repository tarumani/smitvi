# Smitvi

**The Global Human Intelligence Network** — own, organize, monetize, and scale expertise with AI Knowledge Twins.

## Stack

| Layer | Tool |
|---|---|
| App | Next.js 16 on **Fly.io** |
| Domain DNS | **GoDaddy** (`smitvi.com`) |
| Auth / DB / Storage | **Supabase** |
| AI | OpenAI |
| Payments | Stripe + Razorpay |

GoDaddy shared hosting is for DNS only — the Node app runs on Fly (same pattern as your other apps).

## Local development

```bash
cp .env.example .env
npm install
npx prisma dev --name smitvi --detach   # optional local Postgres
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production (smitvi.com)

See **[PRODUCTION.md](./PRODUCTION.md)** — GoDaddy DNS → Fly.io + Supabase.

```bash
cd smitvi
fly secrets set ...   # see PRODUCTION.md
fly deploy
fly certs add smitvi.com
```

Then point GoDaddy A/CNAME records at Fly.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Local Next.js |
| `npm run build` | Production Next build |
| `npm run db:deploy` | Apply Prisma migrations |
| `npm test` | Unit tests |
| `npm run typecheck` | TypeScript |
