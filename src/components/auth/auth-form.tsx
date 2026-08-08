"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES, APP_OUTCOME } from "@/config/constants";
import { createSupabaseBrowserClient } from "@/infrastructure/auth/supabase/client";
import { getBrowserOrigin } from "@/infrastructure/http/request-origin";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
  /** Off by default until Supabase custom domain + Google branding are ready. */
  enableGoogleAuth?: boolean;
};

function getSafeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return ROUTES.hub.dashboard;
  }
  return value;
}

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

function errorMessage(error: unknown, fallback: string) {
  let message = "";
  let code = "";

  if (error && typeof error === "object") {
    message =
      readErrorField(error, "message") ||
      readErrorField(error, "msg") ||
      readErrorField(error, "error_description") ||
      readErrorField(error, "error");
    code = readErrorField(error, "code") || readErrorField(error, "status");
  } else if (typeof error === "string") {
    message = error.trim();
  }

  if (!message && error instanceof Error) {
    message = error.message.trim();
  }

  const combined = [message, code].filter(Boolean).join(" ").toLowerCase();
  if (!combined) {
    return `${fallback}. If this is signup, check Supabase Auth logs and SMTP settings.`;
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
    combined.includes("smtp")
  ) {
    return "Could not send the verification email. In Supabase → Authentication → SMTP, confirm host/port (usually 587), username, password, and sender email — then check Auth logs.";
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
    return "Add https://smitvi.com/auth/callback to Supabase → Authentication → URL configuration → Redirect URLs.";
  }
  if (
    combined.includes("user already") ||
    combined.includes("already registered") ||
    combined.includes("already been registered")
  ) {
    return "An account with this email already exists. Sign in, or use Resend verification email if you haven’t confirmed yet.";
  }

  return message || fallback;
}

export function AuthForm({ mode, enableGoogleAuth = false }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState(
    () => searchParams.get("email")?.trim() ?? "",
  );
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [oauthLoading, setOauthLoading] = useState(false);
  const [showResend, setShowResend] = useState(
    () => searchParams.get("verify") === "1",
  );

  const title = mode === "login" ? "Welcome back" : "Start earning";
  const subtitle =
    mode === "login"
      ? `${APP_OUTCOME} Sign in to train your Twin and grow your income.`
      : "Create an account — verify your email, then train your Twin and sell what you know.";

  useEffect(() => {
    if (searchParams.get("verify") === "1") {
      toast.message("Verify your email before signing in.", {
        description:
          "Open the confirmation link we sent, then come back to sign in.",
      });
    }

    const error = searchParams.get("error");
    if (!error) return;
    const messages: Record<string, string> = {
      missing_code: "Sign-in was cancelled or incomplete. Try again.",
      auth_callback_failed:
        "Could not finish Google sign-in. Confirm Supabase Auth → URL configuration includes your site’s /auth/callback (e.g. https://smitvi.com/auth/callback and http://localhost:3000/auth/callback for local).",
    };
    toast.error(messages[error] ?? "Authentication failed. Please try again.");
  }, [searchParams]);

  function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const origin = getBrowserOrigin();

        if (mode === "login") {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            const lower = error.message.toLowerCase();
            if (
              lower.includes("invalid login credentials") ||
              lower.includes("invalid credentials") ||
              lower.includes("email not confirmed")
            ) {
              setShowResend(true);
            }
            throw error;
          }
          if (!data.user?.email_confirmed_at) {
            await supabase.auth.signOut();
            setShowResend(true);
            throw new Error(
              "Confirm your email before signing in. Check your inbox for the verification link.",
            );
          }
          toast.success("Signed in");
          router.replace(nextPath);
          router.refresh();
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${origin}${ROUTES.authCallback}?next=${encodeURIComponent(nextPath)}`,
          },
        });
        if (error) throw error;

        // Email confirmation is required — never treat an unverified signup as logged in.
        if (data.session && data.user?.email_confirmed_at) {
          toast.success("Account created");
          router.replace(nextPath);
          router.refresh();
          return;
        }

        // Supabase may return a session when confirm-email is off — never keep it.
        if (data.session) {
          await supabase.auth.signOut();
        }

        if (!data.user) {
          throw new Error(
            "Could not create your account. Try a different email or sign in if you already registered.",
          );
        }

        // Existing accounts return a user with no identities and no email is sent.
        if ((data.user.identities?.length ?? 0) === 0) {
          setShowResend(true);
          throw new Error(
            "An account with this email already exists. Sign in, or resend the verification email if you haven’t confirmed yet.",
          );
        }

        setShowResend(true);
        toast.success("Verification email sent", {
          description:
            "Open the link in your inbox to verify your email, then sign in. Check spam if you don’t see it.",
        });
        router.replace(
          `${ROUTES.login}?next=${encodeURIComponent(nextPath)}&verify=1&email=${encodeURIComponent(email.trim())}`,
        );
      } catch (error) {
        console.error("[auth]", error);
        toast.error(errorMessage(error, "Authentication failed"));
      }
    });
  }

  async function handleResendVerification() {
    const target = email.trim();
    if (!target) {
      toast.error("Enter the email you used to sign up");
      return;
    }
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: target,
          options: {
            emailRedirectTo: `${getBrowserOrigin()}${ROUTES.authCallback}?next=${encodeURIComponent(nextPath)}`,
          },
        });
        if (error) throw error;
        toast.success("Verification email resent", {
          description: "Check your inbox (and spam), then open the link.",
        });
      } catch (error) {
        toast.error(errorMessage(error, "Could not resend verification email"));
      }
    });
  }

  async function handleGoogle() {
    try {
      setOauthLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getBrowserOrigin()}${ROUTES.authCallback}?next=${encodeURIComponent(nextPath)}`,
          skipBrowserRedirect: false,
        },
      });
      if (error) throw error;
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      throw new Error("Google sign-in did not return a redirect URL");
    } catch (error) {
      toast.error(errorMessage(error, "Google sign-in failed"));
      setOauthLoading(false);
    }
  }

  return (
    <GlassCard className="w-full max-w-md px-5 py-5 sm:px-6 sm:py-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
          {subtitle}
        </p>
      </div>

      {enableGoogleAuth ? (
        <>
          <Button
            type="button"
            variant="secondary"
            className="mt-5 h-10 w-full"
            disabled={isPending || oauthLoading}
            onClick={() => void handleGoogle()}
          >
            {oauthLoading ? "Redirecting to Google…" : "Continue with Google"}
          </Button>

          <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-wider text-[var(--muted)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            or email
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
        </>
      ) : null}

      <form
        className={enableGoogleAuth ? "space-y-3" : "mt-5 space-y-3"}
        onSubmit={handleEmailAuth}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Password</Label>
            {mode === "login" ? (
              <Link
                href={ROUTES.forgotPassword}
                className="text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Forgot password?
              </Link>
            ) : null}
          </div>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
            className="h-10"
          />
        </div>
        <Button className="mt-1 h-10 w-full" type="submit" disabled={isPending}>
          {isPending
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      {mode === "signup" ? (
        <p className="mt-3 text-center text-xs text-[var(--muted)]">
          Email verification is required. You’ll get a confirmation link after
          signup.
        </p>
      ) : null}

      {mode === "login" && showResend ? (
        <div className="mt-3 space-y-2">
          <p className="text-center text-xs text-[var(--muted)]">
            If this account exists but isn’t verified yet, resend the
            confirmation email, open the link, then sign in again.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="h-10 w-full"
            disabled={isPending}
            onClick={() => void handleResendVerification()}
          >
            Resend verification email
          </Button>
        </div>
      ) : null}

      <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        {mode === "login" ? (
          <>
            New to Smitvi?{" "}
            <Link
              href={ROUTES.signup}
              className="font-semibold text-[var(--accent)] hover:underline"
            >
              Create your Twin
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={ROUTES.login}
              className="font-semibold text-[var(--accent)] hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </GlassCard>
  );
}
