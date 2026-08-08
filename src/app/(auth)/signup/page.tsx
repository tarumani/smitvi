import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { isGoogleAuthEnabled } from "@/lib/auth-features";
import { CaptureReferralFromUrl } from "@/components/referral/capture-referral-from-url";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Create account",
};

function AuthFormFallback() {
  return <Skeleton className="h-[360px] w-full max-w-md rounded-3xl" />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <CaptureReferralFromUrl />
      <AuthForm mode="signup" enableGoogleAuth={isGoogleAuthEnabled()} />
    </Suspense>
  );
}
