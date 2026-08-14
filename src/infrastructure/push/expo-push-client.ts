export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
};

type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: unknown;
};

export async function sendExpoPushMessages(
  messages: ExpoPushMessage[],
): Promise<void> {
  if (messages.length === 0) return;

  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  const accessToken = process.env.EXPO_ACCESS_TOKEN;

  for (const chunk of chunks) {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(chunk),
    });

    if (!response.ok) continue;

    const json = (await response.json()) as { data?: ExpoPushTicket[] };
    const tickets = json.data ?? [];
    for (const ticket of tickets) {
      if (ticket.status === "error") {
        console.warn("[expo-push]", ticket.message, ticket.details);
      }
    }
  }
}
