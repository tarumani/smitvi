"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PayPalSubscriptionButtons } from "@/components/billing/paypal-subscription-buttons";
import { ROUTES } from "@/config/constants";

type PlanUpgradeOptionsProps = {
  plan: "PRO" | "BUSINESS";
};

export function PlanUpgradeOptions({ plan }: PlanUpgradeOptionsProps) {
  const [isPending, startTransition] = useTransition();

  function checkoutRazorpay() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/billing/checkout", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, provider: "RAZORPAY" }),
        });
        const json: unknown = await response.json();
        if (response.status === 401) {
          window.location.href = `${ROUTES.login}?next=${encodeURIComponent(ROUTES.pricing)}`;
          return;
        }
        if (!response.ok) {
          const message =
            typeof json === "object" &&
            json !== null &&
            "error" in json &&
            typeof (json as { error?: { message?: string } }).error?.message ===
              "string"
              ? (json as { error: { message: string } }).error.message
              : "Checkout failed";
          throw new Error(message);
        }

        const checkout = (
          json as {
            data: {
              checkout: {
                provider: "RAZORPAY";
                subscriptionId: string;
                keyId: string;
              };
            };
          }
        ).data.checkout;

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const RazorpayCtor = (
            window as unknown as {
              Razorpay: new (options: Record<string, unknown>) => {
                open: () => void;
              };
            }
          ).Razorpay;
          const rzp = new RazorpayCtor({
            key: checkout.keyId,
            subscription_id: checkout.subscriptionId,
            name: "Smitvi",
            description: `${plan} subscription`,
            theme: { color: "#0f766e" },
          });
          rzp.open();
        };
        document.body.appendChild(script);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Checkout failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-center text-[10px] uppercase tracking-wider text-[var(--muted)]">
          India
        </p>
        <Button
          className="w-full"
          onClick={checkoutRazorpay}
          disabled={isPending}
        >
          {isPending ? "Opening Razorpay…" : `Upgrade with Razorpay`}
        </Button>
      </div>
      <PayPalSubscriptionButtons plan={plan} />
    </div>
  );
}
