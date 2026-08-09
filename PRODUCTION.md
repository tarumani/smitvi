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

Optional: Stripe live keys. **Payments (current): Razorpay only** — set `BILLING_PROVIDER=RAZORPAY` and Razorpay secrets on Fly.

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
   - Site URL: `https://smitvi.com` (never `0.0.0.0` — browsers reject that host)
   - Redirect URLs:
     - `https://smitvi.com/auth/callback`
     - `https://www.smitvi.com/auth/callback`
     - `http://localhost:3000/auth/callback` (local dev only)
4. Auth → Providers → enable **Google** (required for “Continue with Google”):
   - Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client (Web)
   - Authorized redirect URI must be exactly:
     `https://ofinmuzcjanjjzojxqdv.supabase.co/auth/v1/callback`
     (use your project’s Auth callback URL from Supabase → Authentication → Providers → Google)
   - Paste Client ID + Client Secret into Supabase Google provider and turn **Enable** on
   - Without this, Google returns: `Unsupported provider: provider is not enabled`
4b. **Google shows `*.supabase.co` (“Continue to…”) instead of Smitvi** — expected until you use a **Supabase Custom Domain** (paid add-on on Pro/Enterprise):
   - Supabase Dashboard → **Project Settings → Custom Domains** → add e.g. `auth.smitvi.com` (recommended) or `api.smitvi.com`.
   - GoDaddy DNS: add the **CNAME** records Supabase shows (verify domain in Supabase).
   - When active, set **`NEXT_PUBLIC_SUPABASE_URL=https://auth.smitvi.com`** on Fly and in GitHub repo secrets (same anon key).
   - Google Cloud → OAuth client → **Authorized redirect URIs**: add `https://auth.smitvi.com/auth/v1/callback` (keep the old `https://ofinmuzcjanjjzojxqdv.supabase.co/auth/v1/callback` until cutover works).
   - **Authorized JavaScript origins**: `https://smitvi.com`, `https://www.smitvi.com`, `http://localhost:3000` (dev only).
   - Google Auth Platform → **Branding**: app name **Smitvi**, logo, homepage `https://smitvi.com` (verification can take a few days; improves consent screen but does **not** replace custom domain on the account chooser).
   - Smitvi app redirect URLs stay on **your site**: `https://smitvi.com/auth/callback` (already configured in Supabase → Authentication → URL configuration).
   - Docs: [Supabase custom domains](https://supabase.com/docs/guides/platform/custom-domains), [Google + Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google).
5. Keep **Confirm email** enabled under Auth → Providers → Email (**required**).
   - Path: Supabase → Authentication → Providers → Email → **Confirm email** = ON.
   - After signup, users must open the confirmation email before they can use the app.
   - The Smitvi app also blocks unverified sessions server-side and offers “Resend verification email” on login.
   - Unverified login often shows “Invalid login credentials” from Supabase until the link is opened.
6. **Custom SMTP is required for production signup emails** (Auth → SMTP):
   - Enable Custom SMTP and **Save** (toggle alone is not enough until saved).
   - **Sender name:** `Smitvi` (not “Supabase Auth”).
   - **Sender email:** a real address on your domain, e.g. `noreply@smitvi.com` or `support@smitvi.com` (GoDaddy mailbox or transactional provider).
   - Use port **587** (STARTTLS) unless your provider documents otherwise.
   - Sender / admin email must be allowed by your SMTP provider (verified domain or mailbox).
   - Set **Sender name** to `Smitvi`.
   - Edit **Authentication → Email Templates** (Confirm signup) to remove “powered by Supabase” and use Smitvi copy — see `docs/AUTH_EMAIL_SMTP.md`.
   - After saving, raise Auth → Rate Limits if needed (custom SMTP starts low).
   - If signup shows “Error sending confirmation mail”, open **Logs → Auth** and your SMTP provider’s logs — wrong password, blocked port, or unverified domain are the usual causes.
   - **cPanel mail for smitvi.com:** Supabase Host must be **`mail.smitvi.com`**, port **465** (or 587), **not** the server IP (e.g. `68.178.145.172`). See `docs/AUTH_EMAIL_SMTP.md` § cPanel vs Supabase.
   - GoDaddy Workspace (non-cPanel): host `smtpout.secureserver.net`, port `587`, username = full email.
7. Storage → create a **private** bucket named exactly `knowledge`
   (required for PDF/knowledge uploads; without it uploads fail with “Bucket not found”).
   The app will also try to auto-create this bucket on first upload if the service role key allows it.
8. Storage → create or auto-create a **private** bucket named `avatars` (profile photos).
   Set `SUPABASE_AVATARS_BUCKET=avatars` on Fly (already in `fly.toml` `[env]`).
9. **Cron & growth emails** — set the same secret on Fly and GitHub:
   - `fly secrets set CRON_SECRET=your-long-random-string --app smitvi`
   - GitHub repo secret `CRON_SECRET` (for activation nudge, listing nudge, hub digest, inactive-user cleanup workflows)
   - Inactive cleanup (abandoned empty FREE accounts): pause after 10 days with no activity, permanently delete 7 days later if they never sign back in. Disable with `INACTIVE_USER_CLEANUP_ENABLED=false`.
10. **Optional:** `JINA_READER_API_KEY` for reliable Notion/website imports; `NEXT_PUBLIC_ADSENSE_DISPLAY_SLOT` for a footer ad unit after cookie consent.
11. GitHub Actions build needs these repo secrets (inlined at build time):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `FLY_API_TOKEN`

## 2. Migrations

Before the first Human Intelligence Graph / search deploy, in Supabase → **Database → Extensions**, enable **`vector`** (pgvector).

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
