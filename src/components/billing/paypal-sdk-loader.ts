let loadPromise: Promise<void> | null = null;
let loadedClientId: string | null = null;

export function loadPayPalSdk(clientId: string): Promise<void> {
  const trimmed = clientId.trim();
  if (!trimmed) {
    return Promise.reject(new Error("Missing PayPal client id"));
  }

  if (window.paypal?.Buttons && loadedClientId === trimmed) {
    return Promise.resolve();
  }

  if (loadPromise && loadedClientId === trimmed) {
    return loadPromise;
  }

  loadedClientId = trimmed;
  const src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(trimmed)}&vault=true&intent=subscription`;

  loadPromise = new Promise((resolve, reject) => {
    let script = document.querySelector(
      'script[data-smitvi-paypal-sdk="1"]',
    ) as HTMLScriptElement | null;

    if (script && script.src === src) {
      const deadline = Date.now() + 15_000;
      const waitForPayPal = () => {
        if (window.paypal?.Buttons) {
          resolve();
          return;
        }
        if (Date.now() > deadline) {
          reject(new Error("PayPal SDK loaded but did not initialize"));
          return;
        }
        window.setTimeout(waitForPayPal, 50);
      };
      waitForPayPal();
      return;
    }

    if (script) {
      script.remove();
      delete (window as { paypal?: unknown }).paypal;
    }

    script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.smitviPaypalSdk = "1";
    script.onload = () => {
      const deadline = Date.now() + 15_000;
      const waitForPayPal = () => {
        if (window.paypal?.Buttons) {
          resolve();
          return;
        }
        if (Date.now() > deadline) {
          reject(new Error("PayPal SDK loaded but did not initialize"));
          return;
        }
        window.setTimeout(waitForPayPal, 50);
      };
      waitForPayPal();
    };
    script.onerror = () => reject(new Error("PayPal SDK failed to load"));
    document.head.appendChild(script);
  });

  return loadPromise.catch((error) => {
    loadPromise = null;
    loadedClientId = null;
    throw error;
  });
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => {
        render: (selector: string) => Promise<void>;
      };
    };
  }
}
