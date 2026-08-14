import { ValidationError } from "@/domain/shared/errors";
import { jsonError } from "@/infrastructure/http/respond";

/**
 * Minimal Razorpay Checkout.js host page for mobile (opens via Linking / browser).
 * Does not change smitvi.com marketing or hub UI — API route only.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key")?.trim() ?? "";
    const orderId = url.searchParams.get("order_id")?.trim() ?? "";
    const amount = url.searchParams.get("amount")?.trim() ?? "";
    const currency = (url.searchParams.get("currency")?.trim() ?? "INR").toUpperCase();
    const listingId = url.searchParams.get("listing_id")?.trim() ?? "";
    const name = url.searchParams.get("name")?.trim() || "Smitvi Marketplace";

    if (!key || !orderId || !amount || !/^\d+$/.test(amount)) {
      throw new ValidationError("Invalid Razorpay pay parameters");
    }

    const amountCents = Number(amount);
    const successDeepLink = "smitvi://library";
    const cancelDeepLink = listingId
      ? `smitvi://marketplace/${encodeURIComponent(listingId)}`
      : "smitvi://orders/purchases";

    // Escape for embedding in JS string literals
    const esc = (value: string) =>
      value
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pay · Smitvi</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px;
      background: #0f1419; color: #e8eef4; text-align: center; }
    button { margin-top: 16px; background: #0f766e; color: #fff; border: 0;
      border-radius: 12px; padding: 14px 22px; font-weight: 700; font-size: 16px; }
    a { color: #5eead4; }
    .muted { color: #94a3b8; font-size: 14px; margin-top: 12px; }
  </style>
</head>
<body>
  <h1>Complete payment</h1>
  <p class="muted">${esc(name)}</p>
  <p><strong>${(amountCents / 100).toFixed(2)} ${esc(currency)}</strong></p>
  <button type="button" id="pay">Pay with Razorpay</button>
  <p class="muted"><a href="${esc(cancelDeepLink)}">Cancel · back to app</a></p>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    (function () {
      var options = {
        key: '${esc(key)}',
        amount: ${amountCents},
        currency: '${esc(currency)}',
        order_id: '${esc(orderId)}',
        name: 'Smitvi Marketplace',
        description: '${esc(name)}',
        theme: { color: '#0f766e' },
        handler: function () {
          window.location.href = '${esc(successDeepLink)}';
        },
        modal: {
          ondismiss: function () {
            window.location.href = '${esc(cancelDeepLink)}';
          }
        }
      };
      function openPay() {
        var rzp = new Razorpay(options);
        rzp.open();
      }
      document.getElementById('pay').addEventListener('click', openPay);
      openPay();
    })();
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
