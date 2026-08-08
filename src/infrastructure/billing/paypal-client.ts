import {
  getPayPalApiBase,
  getPayPalClientId,
  getPayPalMode,
} from "@/config/paypal";

type PayPalTokenResponse = {
  access_token?: string;
};

type PayPalSubscriptionResponse = {
  id?: string;
  status?: string;
  plan_id?: string;
  custom_id?: string;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getPayPalAccessToken(): Promise<string> {
  const clientId = getPayPalClientId();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !secret) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not configured");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const response = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed (${response.status})`);
  }

  const json = (await response.json()) as PayPalTokenResponse;
  if (!json.access_token) {
    throw new Error("PayPal auth returned no access token");
  }

  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + 3_000_000,
  };
  return json.access_token;
}

export async function fetchPayPalSubscription(
  subscriptionId: string,
): Promise<PayPalSubscriptionResponse> {
  const token = await getPayPalAccessToken();
  const response = await fetch(
    `${getPayPalApiBase()}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`PayPal subscription lookup failed (${response.status})`);
  }

  return (await response.json()) as PayPalSubscriptionResponse;
}

export function getPayPalSdkUrl(): string {
  const clientId = encodeURIComponent(getPayPalClientId());
  return `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
}

export function payPalModeLabel(): string {
  return getPayPalMode();
}
