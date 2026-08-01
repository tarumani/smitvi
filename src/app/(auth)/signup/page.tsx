import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Create account",
};

function AuthFormFallback() {
  return <Skeleton className="h-[520px] w-full max-w-md rounded-3xl" />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
