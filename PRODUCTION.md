# Smitvi — Production launch checklist

**Production domain:** [https://smitvi.com](https://smitvi.com)

## Your stack (same as your other apps)

| Piece | Provider | Role |
|---|---|---|
| Domain / DNS | **GoDaddy** | `smitvi.com` records only |
| App compute | **Fly.io** | Runs the Next.js container |
| Auth + Postgres + Storage | **Supabase** | Users, DB, knowledge files |
| Source / CI | **GitHub** | Code + optional `fly deploy` |
| AI | **OpenAI** | Embeddings, Twin chat, voice |
| Payments | Stripe / Razorpay | Subscriptions + marketplace |

**Important:** GoDaddy **shared hosting** (PHP/cPanel) cannot run this Next.js app. Keep GoDaddy for the domain/DNS — deploy the app on **Fly**, like your other projects.

---

## 0. GoDaddy DNS → Fly

### A. Deploy the app on Fly first
```bash
cd smitvi
fly auth login
fly launch --no-deploy   # confirm app name `smitvi`, region (e.g. iad)
```

Set secrets (never commit `.env`):
```bash
fly secrets set \
  NEXT_PUBLIC_APP_URL=https://smitvi.com \
  NEXT_PUBLIC_APP_NAME=Smitvi \
  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  DATABASE_URL="postgresql://..." \
  DIRECT_URL="postgresql://..." \
  OPENAI_API_KEY=sk-... \
  STORAGE_DRIVER=supabase \
  SUPABASE_STORAGE_BUCKET=knowledge
```

Optional later: Stripe / Razorpay live keys.

```bash
fly deploy
fly certs add smitvi.com
fly certs add www.smitvi.com
fly ips list
```

Note the **A** / **AAAA** addresses Fly shows.

### B. Point GoDaddy at Fly
1. GoDaddy → **My Products** → Domains → **smitvi.com** → **DNS**
2. Turn **off** Domain Forwarding / Website Builder for this domain (they conflict).
3. You do **not** need to host files on GoDaddy shared hosting for Smitvi.
4. Set DNS (use values from `fly ips list` / `fly certs`):

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | Fly IPv4 from `fly ips list` | 600 |
| AAAA | `@` | Fly IPv6 (if issued) | 600 |
| CNAME | `www` | `smitvi.fly.dev` | 600 |

5. Wait until `fly certs show smitvi.com` is ready, then open https://smitvi.com

Leave GoDaddy **email MX** records alone if you use GoDaddy email.

---

## 1. Supabase

1. Production project → copy URL, anon key, service role key.
2. `DATABASE_URL`: use a Postgres URL Fly can reach (direct or pooler; prefer direct/`sslmode=require` if migrate fails on pooler).
3. Auth → URL configuration (required for signup / Google):
   - Site URL: `https://smitvi.com`
   - Redirect URLs:
     - `https://smitvi.com/auth/callback`
     - `https://www.smitvi.com/auth/callback`
4. Auth → Providers → enable **Google** (Apple optional later).
5. Keep **Confirm email** enabled under Auth → Providers → Email (required to reduce spam signups).
6. Storage → private bucket `knowledge`.
7. GitHub Actions build needs these repo secrets (inlined at build time):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `FLY_API_TOKEN`

## 2. Migrations

Fly runs this automatically on each deploy (`release_command` in `fly.toml`):

```bash
npx prisma migrate deploy
```

Manual (if needed):
```bash
fly ssh console -C "npx prisma migrate deploy"
```

## 3. GitHub

Push the `smitvi` app, then deploy:

```bash
git push
cd smitvi && fly deploy
```

**No local Docker?** Use GitHub Actions (already in `.github/workflows/fly-deploy.yml`):

1. Create a Fly deploy token: `fly tokens create deploy -a smitvi`
2. Add it as a GitHub secret named `FLY_API_TOKEN` on `tarumani/smitvi`
3. Push to `master` (or run the workflow manually) — GitHub builds and deploys on Fly for you

## 4. Payments

- Stripe webhook: `https://smitvi.com/api/v1/billing/webhook/stripe`
- Razorpay webhook: `https://smitvi.com/api/v1/billing/webhook/razorpay`

## 5. Smoke test

1. https://smitvi.com/api/v1/health
2. Sign up → onboarding
3. Upload PDF on `/knowledge`
4. Twin chat on `/chat`
5. (Pro) API key + `/api/public/v1/me`

## 6. Local vs production storage

| Env | Driver |
|---|---|
| `npm run dev` | `local` (`.data/uploads`) |
| Fly production | `supabase` (`STORAGE_DRIVER=supabase`) |
