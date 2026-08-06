export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; reason: string };

export async function sendTransactionalEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "Smitvi <updates@smitvi.com>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[email] RESEND_API_KEY not set; skipping send", {
        to: input.to,
        subject: input.subject,
      });
    }
    return { ok: false, reason: "email_not_configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[email] Resend error", response.status, text);
    return { ok: false, reason: "provider_error" };
  }

  const json = (await response.json()) as { id?: string };
  return { ok: true, id: json.id };
}
