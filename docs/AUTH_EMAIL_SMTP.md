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
- Redirect URLs: include `https://smitvi.com/auth/callback`

### 4. Test

1. Sign up with a new email on https://smitvi.com/signup  
2. Check inbox: **From** should be `Smitvi <your-smtp-address@>`  
3. If it fails: Supabase → **Logs → Auth** and your SMTP provider logs  

## Google sign-in (optional, later)

The app hides **Continue with Google** unless `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true` (see `fly.toml`). Re-enable after Supabase **custom domain** (`auth.smitvi.com`) and Google OAuth branding — see `PRODUCTION.md` §4b.
