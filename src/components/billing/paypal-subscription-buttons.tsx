"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@/config/constants";
import { readApiErrorMessage } from "@/lib/api-response";

type PayPalSubscriptionButtonsProps = {
  plan: "PRO" | "BUSINESS";
};

type PayPalConfig = {
  clientId: string;
  planId: string;
  userId: string;
};

type PayPalActions = {
  subscription: {
    create: (input: Record<string, unknown>) => Promise<string>;
  };
};

type PayPalButtonsInstance = {
  render: (selector: string) => Promise<void>;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => PayPalButtonsInstance;
    };
  }
}

function loadPayPalSdk(clientId: string): Promise<void> {
  const src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&vault=true&intent=subscription`;
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing && window.paypal) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("PayPal SDK failed to load"));
    document.body.appendChild(script);
  });
}

export function PayPalSubscriptionButtons({ plan }: PayPalSubscriptionButtonsProps) {
  const containerId = useId().replace(/:/g, "");
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const response = await fetch(
          `/api/v1/billing/paypal/config?plan=${plan}`,
          { credentials: "same-origin" },
        );
        if (response.status === 401) {
          window.location.href = `${ROUTES.login}?next=${encodeURIComponent(ROUTES.pricing)}`;
          return;
        }
        const json: unknown = await response.json();
        if (!response.ok) {
          setUnavailable(true);
          return;
        }

        const config = (json as { data?: PayPalConfig }).data;
        if (!config?.clientId || !config.planId || !config.userId) {
          setUnavailable(true);
          return;
        }

        await loadPayPalSdk(config.clientId);
        if (cancelled || !window.paypal || !containerRef.current) return;

        containerRef.current.innerHTML = "";
        await window.paypal
          .Buttons({
            style: {
              shape: "pill",
              color: "blue",
              layout: "vertical",
              label: "paypal",
            },
            createSubscription(_data: unknown, actions: PayPalActions) {
              return actions.subscription.create({
                plan_id: config.planId,
                custom_id: config.userId,
                application_context: {
                  brand_name: "Smitvi",
                  user_action: "SUBSCRIBE_NOW",
                },
              });
            },
            onApprove(data: { subscriptionID?: string }) {
              const subscriptionId = data.subscriptionID?.trim();
              if (!subscriptionId) {
                toast.error("PayPal did not return a subscription id.");
                return;
              }
              void (async () => {
                try {
                  const confirm = await fetch("/api/v1/billing/paypal/confirm", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan, subscriptionId }),
                  });
                  const body: unknown = await confirm.json();
                  if (!confirm.ok) {
                    throw new Error(
                      readApiErrorMessage(body, "Could not activate PayPal subscription"),
                    );
                  }
                  toast.success(`You're on ${plan}`, {
                    description: "PayPal subscription is active on Smitvi.",
                  });
                  router.push(`${ROUTES.billingSettings}?checkout=success&plan=${plan}`);
                  router.refresh();
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "PayPal activation failed",
                  );
                }
              })();
            },
            onError() {
              toast.error("PayPal checkout failed. Try again or use Razorpay.");
            },
          })
          .render(`#${containerId}`);
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [containerId, plan, router]);

  if (unavailable) {
    return null;
  }

  return (
    <div className="space-y-1">
      <p className="text-center text-[10px] uppercase tracking-wider text-[var(--muted)]">
        International
      </p>
      <div id={containerId} ref={containerRef} className="min-h-[45px]" />
    </div>
  );
}
