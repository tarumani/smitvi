"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";
import { readApiErrorMessage } from "@/lib/api-response";
import { loadPayPalSdk } from "@/components/billing/paypal-sdk-loader";

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

type Status = "loading" | "ready" | "error";

function containerHasPayPalButton(element: HTMLElement | null): boolean {
  if (!element) return false;
  return Boolean(
    element.querySelector("iframe") ||
      element.querySelector("[data-paypal-onboarding]") ||
      element.childElementCount > 0,
  );
}

export function PayPalSubscriptionButtons({ plan }: PayPalSubscriptionButtonsProps) {
  const containerId = useId().replace(/:/g, "");
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStatus("loading");
      setErrorMessage(null);

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
          throw new Error(
            readApiErrorMessage(json, "PayPal is not configured on this site"),
          );
        }

        const config = (json as { data?: PayPalConfig }).data;
        if (!config?.clientId || !config.planId || !config.userId) {
          throw new Error("PayPal configuration is incomplete");
        }

        await loadPayPalSdk(config.clientId);
        if (cancelled || !window.paypal || !containerRef.current) return;

        containerRef.current.innerHTML = "";
        await window.paypal.Buttons({
          style: {
            shape: "rect",
            color: "gold",
            layout: "vertical",
            label: "paypal",
            height: 44,
            tagline: false,
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
                    readApiErrorMessage(
                      body,
                      "Could not activate PayPal subscription",
                    ),
                  );
                }
                toast.success(`You're on ${plan}`, {
                  description: "PayPal subscription is active on Smitvi.",
                });
                router.push(
                  `${ROUTES.billingSettings}?checkout=success&plan=${plan}`,
                );
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
        }).render(`#${containerId}`);

        await new Promise((resolve) => window.setTimeout(resolve, 400));
        if (cancelled) return;

        if (!containerHasPayPalButton(containerRef.current)) {
          throw new Error(
            "PayPal button did not appear. Confirm Live Client ID and subscription plan ids in PayPal Dashboard.",
          );
        }

        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "PayPal could not load",
        );
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [containerId, plan, router, retryKey]);

  return (
    <div className="w-full border-t border-[var(--border)] pt-3">
      <p className="mb-2 text-center text-[10px] uppercase tracking-wider text-[var(--muted)]">
        International
      </p>
      <div className="w-full space-y-2">
        {status === "loading" ? (
          <p className="text-center text-xs text-[var(--muted-foreground)]">
            Loading PayPal…
          </p>
        ) : null}
        {status === "error" ? (
          <div className="space-y-2 text-center">
            <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
              {errorMessage ?? "PayPal unavailable"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-full"
              onClick={() => setRetryKey((value) => value + 1)}
            >
              Retry PayPal
            </Button>
          </div>
        ) : null}
        <div
          id={containerId}
          ref={containerRef}
          className={`min-h-[48px] w-full max-w-full [&>div]:mx-auto [&>div]:w-full [&>div]:max-w-full ${status === "error" ? "hidden" : "block"}`}
        />
      </div>
    </div>
  );
}
