function readErrorField(error: object, key: string): string {
  if (!(key in error)) return "";
  const value = (error as Record<string, unknown>)[key];
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value && typeof value === "object") {
    try {
      const encoded = JSON.stringify(value);
      return encoded === "{}" ? "" : encoded;
    } catch {
      return "";
    }
  }
  return "";
}

function normalizeMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed || trimmed === "{}" || trimmed === "[object Object]") {
    return "";
  }
  return trimmed;
}

export type AuthErrorContext = "auth" | "reset-email" | "reset-password";

function emptyMessageFallback(context: AuthErrorContext): string {
  switch (context) {
    case "reset-email":
      return "Could not send the password reset email. In Supabase → Authentication, enable Custom SMTP, fix the Reset password template (use {{ .ConfirmationURL }}), and add https://smitvi.com/auth/recovery/callback to Redirect URLs. Then check Logs → Auth.";
    case "reset-password":
      return "Could not update your password. Open the reset link from your email again, or request a new link from Forgot password.";
    default:
      return "Enable Custom SMTP in Supabase (Authentication → SMTP): Host mail.smitvi.com (not IP), port 465, username noreply@smitvi.com, cPanel mailbox password, and {{ .ConfirmationURL }} in templates — or use Continue with Google.";
  }
}

/** Maps Supabase Auth errors to user-facing copy (avoids raw `{}` from empty API bodies). */
export function formatAuthErrorMessage(
  error: unknown,
  fallback: string,
  context: AuthErrorContext = "auth",
): string {
  let message = "";
  let code = "";

  if (error && typeof error === "object") {
    message = normalizeMessage(
      readErrorField(error, "message") ||
        readErrorField(error, "msg") ||
        readErrorField(error, "error_description") ||
        readErrorField(error, "error"),
    );
    code = readErrorField(error, "code") || readErrorField(error, "status");
  } else if (typeof error === "string") {
    message = normalizeMessage(error);
  }

  if (!message && error instanceof Error) {
    message = normalizeMessage(error.message);
  }

  const combined = [message, code].filter(Boolean).join(" ").toLowerCase();
  if (!combined) {
    return `${fallback}. ${emptyMessageFallback(context)}`;
  }

  if (combined.includes("provider is not enabled")) {
    return "Google sign-in is not enabled yet in Supabase. Enable Authentication → Providers → Google.";
  }
  if (
    combined.includes("invalid login credentials") ||
    combined.includes("invalid credentials")
  ) {
    return "Invalid email or password — or your email is not verified yet. Check your inbox for the confirmation link, then try again.";
  }
  if (combined.includes("email not confirmed")) {
    return "Confirm your email before signing in. Open the verification link we sent, then come back.";
  }
  if (
    combined.includes("error sending confirmation") ||
    combined.includes("error sending email") ||
    combined.includes("smtp") ||
    combined.includes("recovery") ||
    combined.includes("mailer") ||
    combined.includes("535") ||
    combined.includes("authentication failed for")
  ) {
    return "Could not send the email. Fix Supabase → Authentication → SMTP: Host must be mail.smitvi.com (not the server IP), port 465 or 587, username = full noreply@smitvi.com, and the same password that works in cPanel webmail — then check Auth logs for 535.";
  }
  if (
    combined.includes("not authorized") ||
    combined.includes("email address cannot be used")
  ) {
    return "This email isn’t allowed until custom SMTP is working. Confirm SMTP is enabled and saved in Supabase, then try again.";
  }
  if (
    combined.includes("redirect") &&
    (combined.includes("not allowed") || combined.includes("whitelist"))
  ) {
    return "Add https://smitvi.com/auth/recovery/callback (and https://smitvi.com/auth/callback for Google) under Supabase → Authentication → URL configuration → Redirect URLs.";
  }
  if (
    combined.includes("user already") ||
    combined.includes("already registered") ||
    combined.includes("already been registered")
  ) {
    return "An account with this email already exists. Sign in, or use Resend verification email if you haven’t confirmed yet.";
  }
  if (combined.includes("over_email_send_rate_limit") || combined.includes("rate limit")) {
    return "Too many emails sent recently. Wait a few minutes, then try again.";
  }

  return message || fallback;
}
