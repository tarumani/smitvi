# Smitvi — branded auth emails (Supabase)

Verification mail **cannot** be changed from the Next.js app. Configure **Supabase Dashboard → Authentication → SMTP** and **Email Templates**.

## Why you see `Supabase Auth <noreply@mail.app.supabase.io>`

Supabase’s **default mailer** is used until **Custom SMTP** is enabled and saved. The footer “powered by Supabase” comes from the default template.

## Steps (production)

### 1. Custom SMTP (required)

Supabase → **Authentication → SMTP Settings**:

| Field | Example |
|--------|---------|
| Enable Custom SMTP | ON → **Save** |
| Sender name | `Smitvi` |
| Sender email | `noreply@smitvi.com` or `support@smitvi.com` |
| Host | GoDaddy: `smtpout.secureserver.net` (or your provider) |
| Port | `587` (STARTTLS) |
| Username | Full mailbox (e.g. `support@smitvi.com`) |
| Password | That mailbox password |

Use a real mailbox on **smitvi.com** (GoDaddy Email / Microsoft / Google Workspace). Add **SPF/DKIM** in GoDaddy DNS if your provider gives records — improves deliverability.

#### GoDaddy Workspace Email (common for smitvi.com)

| Field | Value |
|--------|--------|
| Host | `smtpout.secureserver.net` |
| Port | **587** (STARTTLS) |
| Username | **Full address** — e.g. `noreply@smitvi.com` (must match an existing mailbox) |
| Password | That mailbox’s password (reset in GoDaddy → Email if unsure) |
| Sender email | Same as username, e.g. `noreply@smitvi.com` |

**Auth log `535 Authentication Failed for noreply@smitvi.com`** means Supabase reached GoDaddy but **login was rejected**:

1. Create the mailbox in GoDaddy (or use `support@smitvi.com` you know works).
2. Log in to **webmail** for that address once to confirm the password.
3. Paste the **same** password into Supabase SMTP → Save.
4. Retry signup or forgot-password; the log should show **200** on `/signup` or `/recover`, not 500.

If `noreply@` is not needed, use one working mailbox (e.g. `support@smitvi.com`) for both **Username** and **Sender email**.

### 2. Email templates

Use **`{{ .ConfirmationURL }}`** for every action link (never hardcode `https://smitvi.com/auth/callback`).

Supabase → **Authentication → Email Templates**:

| Template | Subject example |
|--------|------------------|
| Confirm signup | `Confirm your Smitvi account` |
| Reset password | `Reset your password` |
| Magic link | `Your Smitvi sign-in link` |

Example link line (all templates):

```html
<p><a href="{{ .ConfirmationURL }}">Confirm email</a></p>
```

### Password reset (including Google sign-in accounts)

Users who originally signed in with **Google** can use **Forgot password** with the **same email**. Supabase sends a recovery link; after they open it, they choose a password on `/reset-password`. They can then sign in with **email + password** or keep using **Google**.

If reset fails in the app (or Supabase Auth logs show mail errors), **Custom SMTP must be enabled** — the default Supabase mailer often fails or is rate-limited in production.

### 3. URL configuration (unchanged)

- Site URL: `https://smitvi.com`
- Redirect URLs (add **each** line):
  - `https://smitvi.com/auth/callback` (Google / email signup)
  - `https://smitvi.com/auth/recovery/callback` (**password reset** — exact path, no query string)
  - `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/recovery/callback` (local dev)

### 3b. If reset still fails (checklist)

1. **Authentication → Providers → Email** — enabled (required to send recovery mail).
2. **Authentication → SMTP** — Custom SMTP **ON**, saved, sender mailbox works (send a test from your mail client).
3. **Reset password template** — link must be `href="{{ .ConfirmationURL }}"`, not a bare `/auth/callback`.
4. **Logs → Auth** — open the log row at the time you clicked “Send reset link”; SMTP and redirect errors appear there.

### 4. Test

1. Sign up with a new email on https://smitvi.com/signup  
2. Check inbox: **From** should be `Smitvi <your-smtp-address@>`  
3. If it fails: Supabase → **Logs → Auth** and your SMTP provider logs  

## Google sign-in

**Continue with Google** is enabled in production builds (`NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true`). Users can sign up or sign in without verification email — useful when SMTP is not ready yet.

Supabase → **Authentication → Providers → Google** must be ON with Client ID/secret from Google Cloud Console.

Redirect URIs in Google Cloud must include your Supabase callback (see Supabase Google provider page).

Optional: Supabase **custom domain** (`auth.smitvi.com`) so Google shows Smitvi instead of `*.supabase.co` — see `PRODUCTION.md` §4b.
