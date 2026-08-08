import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { isGoogleAuthEnabled } from "@/lib/auth-features";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
};

function AuthFormFallback() {
  return <Skeleton className="h-[360px] w-full max-w-md rounded-3xl" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <AuthForm mode="login" enableGoogleAuth={isGoogleAuthEnabled()} />
    </Suspense>
  );
}
