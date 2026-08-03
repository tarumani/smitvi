"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/config/constants";
import { createSupabaseBrowserClient } from "@/infrastructure/auth/supabase/client";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

function getSafeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return ROUTES.dashboard;
  }
  return value;
}

function errorMessage(error: unknown, fallback: string) {
  let message = "";
  if (error && typeof error === "object" && "message" in error) {
    message = String((error as { message: unknown }).message ?? "").trim();
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }
  if (!message) return fallback;

  const lower = message.toLowerCase();
  if (lower.includes("provider is not enabled")) {
    return "Google sign-in is not enabled yet in Supabase. Enable Authentication → Providers → Google.";
  }
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "Invalid email or password — or your email is not verified yet. Check your inbox for the confirmation link, then try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email before signing in. Open the verification link we sent, then come back.";
  }
  return message;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [oauthLoading, setOauthLoading] = useState(false);

  const title = mode === "login" ? "Welcome back" : "Create your Twin";
  const subtitle =
    mode === "login"
      ? "Sign in to manage your Knowledge Twin."
      : "Start indexing your intelligence on Smitvi.";

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
        "Could not finish Google sign-in. Check Supabase redirect URLs include https://smitvi.com/auth/callback",
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
          if (error) throw error;
          if (!data.user?.email_confirmed_at) {
            await supabase.auth.signOut();
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
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${ROUTES.authCallback}?next=${encodeURIComponent(nextPath)}`,
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

        if (data.session) {
          await supabase.auth.signOut();
        }

        toast.success(
          "Confirm your email to finish signup. Check your inbox, then sign in.",
        );
        router.replace(
          `${ROUTES.login}?next=${encodeURIComponent(nextPath)}&verify=1`,
        );
      } catch (error) {
        toast.error(errorMessage(error, "Authentication failed"));
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
          redirectTo: `${window.location.origin}${ROUTES.authCallback}?next=${encodeURIComponent(nextPath)}`,
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

      <form className="space-y-3" onSubmit={handleEmailAuth}>
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
        </div>
        <Button className="mt-1 h-10 w-full" type="submit" disabled={isPending}>
          {isPending
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

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
