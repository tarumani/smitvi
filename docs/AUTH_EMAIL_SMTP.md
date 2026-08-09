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
| Sender email | `noreply@smitvi.com` (must match the mailbox) |
| Host | **`mail.smitvi.com`** — not the server IP |
| Port | **`465`** (SSL, matches cPanel) or **`587`** (TLS) if 465 fails in Supabase |
| Username | Full mailbox: `noreply@smitvi.com` |
| Password | That mailbox’s password (same as cPanel / Roundcube login) |

Use a real mailbox on **smitvi.com** (GoDaddy Email / Microsoft / Google Workspace). Add **SPF/DKIM** in GoDaddy DNS if your provider gives records — improves deliverability.

#### cPanel vs Supabase — match these exactly

cPanel → **Email Accounts → Connect Devices → Mail Client Manual Settings** is the source of truth. Supabase must mirror **outgoing (SMTP)** values, not the raw server IP.

| Field | cPanel (Secure SSL/TLS) | Common mistake in Supabase | Fix in Supabase |
|--------|-------------------------|----------------------------|-----------------|
| Outgoing host | `mail.smitvi.com` | `68.178.145.172` (IP) | **Host → `mail.smitvi.com`** |
| SMTP port | **465** | 465 (OK) or wrong port | **465** first; if Auth logs still fail, try **587** + same host |
| Username | `noreply@smitvi.com` | same | full email address |
| Password | mailbox password | wrong / old password | reset in cPanel → Email Accounts, test **Roundcube** login, paste into Supabase → **Save** |
| Sender email | `noreply@smitvi.com` | same | must match username |
| Sender name | (your brand) | `Smitvi` | OK |

**Why the IP breaks signup:** cPanel’s SSL certificate is for **`mail.smitvi.com`**. Supabase connecting to **`68.178.145.172`** often fails TLS or auth (`535 Authentication Failed`), so **no verification email** is sent and signup looks broken.

**Checklist after you change Host to `mail.smitvi.com`:**

1. cPanel → confirm **`noreply@smitvi.com`** exists; log in to **Webmail/Roundcube** with that password.
2. Supabase → Authentication → **SMTP** → Host `mail.smitvi.com`, Port `465`, Username + Sender email `noreply@smitvi.com`, correct password → **Save**.
3. Supabase → **Logs → Auth** → sign up again → `/signup` should show **200**, not **500** / **535**.
4. Confirm signup template uses `{{ .ConfirmationURL }}` (see §2 below).

**GoDaddy-only mail (not cPanel):** use `smtpout.secureserver.net`, port **587**, same full-email username/password.

### 2. Email templates

Supabase → **Authentication → Email Templates → Confirm signup**:

- **Subject:** `Confirm your Smitvi account`
- **Body:** Replace default copy; use `{{ .ConfirmationURL }}` for the link.
- Remove or replace the “powered by Supabase” footer in the HTML template.

Example opening line:

```html
<p>Hi,</p>
<p>Thanks for joining Smitvi. Confirm your email to finish signup:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm email</a></p>
<p>— The Smitvi team<br/>https://smitvi.com</p>
```

Also update **Magic link**, **Reset password**, and **Change email** templates for consistency.

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

## Google sign-in (optional, later)

The app hides **Continue with Google** unless `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true` (see `fly.toml`). Re-enable after Supabase **custom domain** (`auth.smitvi.com`) and Google OAuth branding — see `PRODUCTION.md` §4b.
