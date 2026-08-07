"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

type UpgradeButtonsProps = {
  plan: "PRO" | "BUSINESS";
};

export function UpgradeButtons({ plan }: UpgradeButtonsProps) {
  const [isPending, startTransition] = useTransition();

  function checkout() {
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
              checkout:
                | { provider: "STRIPE"; checkoutUrl: string | null }
                | {
                    provider: "RAZORPAY";
                    subscriptionId: string;
                    keyId: string;
                  };
            };
          }
        ).data.checkout;

        if (checkout.provider === "STRIPE") {
          if (!checkout.checkoutUrl) {
            throw new Error("Stripe did not return a checkout URL");
          }
          window.location.href = checkout.checkoutUrl;
          return;
        }

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
    <Button className="w-full" onClick={checkout} disabled={isPending}>
      {isPending ? "Opening Razorpay…" : `Upgrade to ${plan}`}
    </Button>
  );
}
