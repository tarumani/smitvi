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

**Option A — Docker Postgres (recommended on Windows)**

```bash
cp .env.example .env
npm install
npm run db:local          # starts pgvector on localhost:5432
```

Set in `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/smitvi?sslmode=disable
DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:5432/smitvi?sslmode=disable
```

Then:

```bash
npm run db:migrate
npm run dev
```

**Option B — Prisma local dev DB (port 51218)**

If `npx prisma dev` fails with npm certificate errors, use Option A instead.

```bash
npx prisma dev --name smitvi --detach
node scripts/ensure-local-db.mjs
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Production Supabase:** enable the **vector** extension (Database → Extensions) before deploying graph/search migrations.

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
