# PayPal subscriptions (Smitvi)

Pro and Business can be purchased with **PayPal** (international) or **Razorpay** (India) on `/pricing`.

## PayPal Dashboard

1. Create **subscription plans** (Pro + Business) and copy plan ids (`P-…`).
2. **Apps & Credentials** → Live app → **Client ID** + **Secret**.

## Environment

| Variable | Where |
|----------|--------|
| `PAYPAL_CLIENT_ID` | **Fly secrets (required for API)** — same REST Client ID as below |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Fly secrets + Docker `--build-arg` (PayPal JS SDK) |
| `PAYPAL_CLIENT_SECRET` | Fly secrets only |
| `PAYPAL_PLAN_PRO` | Fly secrets or `fly.toml` `[env]` |
| `PAYPAL_PLAN_BUSINESS` | Fly secrets or `fly.toml` `[env]` |
| `PAYPAL_MODE` | `live` or `sandbox` |

Local: add to `smitvi/.env` (never commit). Set **`PAYPAL_CLIENT_ID`** to the same value as `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.

Production:

```powershell
fly secrets set -a smitvi `
  PAYPAL_CLIENT_ID=your_client_id `
  NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id `
  PAYPAL_CLIENT_SECRET=your_secret `
  PAYPAL_PLAN_PRO=P-9SS07355VB7661633NJ3UPLY `
  PAYPAL_PLAN_BUSINESS=P-6V88007284946041ENJ3UQ6A `
  PAYPAL_MODE=live
```

Also add GitHub repo secret `NEXT_PUBLIC_PAYPAL_CLIENT_ID` so CI build inlines it for the SDK. The pricing page loads the Client ID from `/api/v1/billing/paypal/config`, so **`PAYPAL_CLIENT_ID` on Fly fixes “not configured”** even before the next CI build.

## Flow

1. User chooses PayPal on pricing → PayPal subscription checkout.
2. Browser calls `POST /api/v1/billing/paypal/confirm` with `subscriptionId`.
3. Server verifies subscription with PayPal API and sets plan in Smitvi.

Marketplace one-time purchases remain **Razorpay** for now.

## Test

1. Sign in → `/pricing` → PayPal button under **International**.
2. Complete sandbox/live subscription.
3. `/settings/billing` → **Current plan** + **Manage in PayPal**.
