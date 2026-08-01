import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
};

function AuthFormFallback() {
  return <Skeleton className="h-[480px] w-full max-w-md rounded-3xl" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
