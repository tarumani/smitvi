"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/config/constants";
import { getPublicEnv } from "@/config/env";
import { createSupabaseBrowserClient } from "@/infrastructure/auth/supabase/client";
import { getBrowserOrigin } from "@/infrastructure/http/request-origin";
import { formatAuthErrorMessage } from "@/lib/auth-error-message";

function passwordResetRedirectOrigin(): string {
  const configured = getPublicEnv().appUrl.replace(/\/$/, "");
  if (configured && !configured.includes("localhost")) {
    return configured;
  }
  return getBrowserOrigin();
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = email.trim();
    if (!target) {
      toast.error("Enter your email address");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const redirectTo = `${passwordResetRedirectOrigin()}${ROUTES.authCallback}?next=${encodeURIComponent(ROUTES.resetPassword)}`;
        const { error } = await supabase.auth.resetPasswordForEmail(target, {
          redirectTo,
        });
        if (error) throw error;
        setSent(true);
        toast.success("Check your email", {
          description: "If an account exists, we sent a password reset link.",
        });
      } catch (error) {
        toast.error(
          formatAuthErrorMessage(
            error,
            "Could not send reset email",
            "reset-email",
          ),
        );
      }
    });
  }

  return (
    <GlassCard className="w-full max-w-md px-5 py-5 sm:px-6 sm:py-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          Reset password
        </h1>
        <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
          Enter the email for your Smitvi account. We&apos;ll send a secure link
          to choose a new password.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Signed up with Google before? Use the same email here — you&apos;ll set
          a password you can use alongside Google sign-in.
        </p>
      </div>

      {sent ? (
        <div className="mt-6 space-y-4 text-center text-sm text-[var(--muted-foreground)]">
          <p>
            If <strong className="text-[var(--foreground)]">{email.trim()}</strong>{" "}
            is registered, you&apos;ll receive an email shortly. Open the link, then
            set a new password.
          </p>
          <p className="text-xs text-[var(--muted)]">
            Check spam. Links expire after a short time — request another if needed.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setSent(false)}
          >
            Send again
          </Button>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-10"
            />
          </div>
          <Button className="h-10 w-full" type="submit" disabled={isPending}>
            {isPending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        <Link
          href={ROUTES.login}
          className="font-semibold text-[var(--accent)] hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </GlassCard>
  );
}
