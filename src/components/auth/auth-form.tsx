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
import { getPublicEnv } from "@/config/env";
import { createSupabaseBrowserClient } from "@/infrastructure/auth/supabase/client";
import { getBrowserOrigin } from "@/infrastructure/http/request-origin";
import { readApiErrorMessage } from "@/lib/api-response";
import { formatAuthErrorMessage } from "@/lib/auth-error-message";

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

function authAppOrigin(): string {
  const configured = getPublicEnv().appUrl.replace(/\/$/, "");
  if (configured && !configured.includes("localhost")) {
    return configured;
  }
  return getBrowserOrigin();
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

        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });
        const json: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message = readApiErrorMessage(
            json,
            formatAuthErrorMessage(null, "Could not create account"),
          );
          throw new Error(message);
        }

        const payload = json as {
          data?: {
            user?: {
              identitiesCount?: number;
              emailConfirmed?: boolean;
            } | null;
            session?: boolean;
          };
        };
        const user = payload.data?.user;
        const hasSession = payload.data?.session;

        if (hasSession && user?.emailConfirmed) {
          toast.success("Account created");
          router.replace(nextPath);
          router.refresh();
          return;
        }

        if (hasSession) {
          await supabase.auth.signOut();
        }

        if (!user) {
          throw new Error(
            "Could not create your account. Try a different email or sign in if you already registered.",
          );
        }

        if ((user.identitiesCount ?? 0) === 0) {
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
        return;
      } catch (error) {
        console.error("[auth]", error);
        const message =
          error instanceof Error
            ? error.message
            : formatAuthErrorMessage(error, "Authentication failed");
        toast.error(
          mode === "signup" ? "Could not create account" : "Authentication failed",
          { description: message },
        );
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
        const response = await fetch("/api/auth/resend-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: target }),
        });
        const json: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message = readApiErrorMessage(
            json,
            formatAuthErrorMessage(null, "Could not resend verification email"),
          );
          throw new Error(message);
        }
        toast.success("Verification email resent", {
          description: "Check your inbox (and spam), then open the link.",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : formatAuthErrorMessage(error, "Could not resend verification email");
        toast.error("Could not resend verification email", { description: message });
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
          redirectTo: `${authAppOrigin()}${ROUTES.authCallback}?next=${encodeURIComponent(nextPath)}`,
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
      toast.error(formatAuthErrorMessage(error, "Google sign-in failed"));
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
          <Label htmlFor="password">Password</Label>
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
          {mode === "login" ? (
            <div className="flex justify-end pt-0.5">
              <Link
                href={ROUTES.forgotPassword}
                className="text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          ) : null}
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
