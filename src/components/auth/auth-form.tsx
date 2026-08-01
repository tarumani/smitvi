"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME, ROUTES } from "@/config/constants";
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

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null,
  );

  const title = mode === "login" ? "Welcome back" : "Create your Twin";
  const subtitle =
    mode === "login"
      ? "Sign in to manage your Knowledge Twin."
      : "Start indexing your intelligence on Smitvi.";

  function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        if (mode === "login") {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          toast.success("Signed in");
          router.replace(nextPath);
          router.refresh();
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${ROUTES.authCallback}?next=${encodeURIComponent(nextPath)}`,
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account");
        router.replace(ROUTES.login);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Authentication failed";
        toast.error(message);
      }
    });
  }

  async function handleOAuth(provider: "google" | "apple") {
    try {
      setOauthLoading(provider);
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${ROUTES.authCallback}?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "OAuth sign-in failed";
      toast.error(message);
      setOauthLoading(null);
    }
  }

  return (
    <GlassCard className="w-full max-w-md p-8">
      <div className="space-y-2 text-center">
        <p className="font-display text-sm font-bold tracking-[0.2em] text-[var(--accent)]">
          {APP_NAME}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">{subtitle}</p>
      </div>

      <div className="mt-8 grid gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending || oauthLoading !== null}
          onClick={() => handleOAuth("google")}
        >
          {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending || oauthLoading !== null}
          onClick={() => handleOAuth("apple")}
        >
          {oauthLoading === "apple" ? "Redirecting…" : "Continue with Apple"}
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-[var(--muted)]">
        <div className="h-px flex-1 bg-[var(--border)]" />
        or email
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <form className="space-y-4" onSubmit={handleEmailAuth}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
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
          />
        </div>
        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
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
