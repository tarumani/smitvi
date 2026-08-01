"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { VoiceAskButton } from "@/components/chat/voice-ask-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Citation = {
  sourceId: string;
  sourceTitle: string;
  chunkId: string;
  excerpt: string;
  score: number;
};

type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  confidence?: number | null;
  citations?: Citation[];
};

type TwinChatProps = {
  initialConversationId?: string | null;
  suggestedQuestions?: string[];
  /** Chat against another expert's Twin (uses public knowledge only). */
  ownerUserId?: string | null;
  /** Company workspace Twin. */
  organizationId?: string | null;
  /** Pro/Business voice Twin. */
  voiceEnabled?: boolean;
  title?: string;
  subtitle?: string;
};

export function TwinChat({
  initialConversationId = null,
  suggestedQuestions = [
    "What are the key ideas in my knowledge base?",
    "Summarize my uploaded documents",
    "What topics am I an expert in?",
  ],
  ownerUserId = null,
  organizationId = null,
  voiceEnabled = false,
  title = "Twin Chat",
  subtitle = "Answers only from your uploaded knowledge — with citations.",
}: TwinChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 1 && !isPending,
    [input, isPending],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  function ask(question: string) {
    const trimmed = question.trim();
    if (trimmed.length < 2 || isPending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "USER",
      content: trimmed,
    };
    const assistantId = crypto.randomUUID();

    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "ASSISTANT", content: "" },
    ]);
    setInput("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: trimmed,
            conversationId,
            ownerUserId,
            organizationId,
          }),
        });

        if (!response.ok) {
          const json: unknown = await response.json();
          const message =
            typeof json === "object" &&
            json !== null &&
            "error" in json &&
            typeof (json as { error?: { message?: string } }).error?.message ===
              "string"
              ? (json as { error: { message: string } }).error.message
              : "Chat failed";
          throw new Error(message);
        }

        if (!response.body) {
          throw new Error("No response stream");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as {
              type: string;
              content?: string;
              conversationId?: string;
              confidence?: number;
              citations?: Citation[];
              message?: string;
            };

            if (event.type === "meta") {
              if (event.conversationId) {
                setConversationId(event.conversationId);
              }
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantId
                    ? {
                        ...message,
                        confidence: event.confidence,
                        citations: event.citations,
                      }
                    : message,
                ),
              );
            }

            if (event.type === "token" && event.content) {
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantId
                    ? {
                        ...message,
                        content: `${message.content}${event.content}`,
                      }
                    : message,
                ),
              );
            }

            if (event.type === "error") {
              throw new Error(event.message ?? "Stream error");
            }
          }
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Chat failed");
        setMessages((current) =>
          current.filter((message) => message.id !== assistantId),
        );
      }
    });
  }

  return (
    <div className="flex h-[calc(100svh-8.5rem)] flex-col rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)]/70 overflow-hidden">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <h1 className="font-display text-xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">{subtitle}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => ask(question)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-left text-sm hover:border-[var(--accent)]"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[90%]",
              message.role === "USER" ? "ml-auto" : "mr-auto",
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                message.role === "USER"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--background)] ring-1 ring-[var(--border)]",
              )}
            >
              {message.role === "ASSISTANT" ? (
                message.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <span className="text-[var(--muted)]">Thinking…</span>
                )
              ) : (
                message.content
              )}
            </div>
            {message.role === "ASSISTANT" && message.citations?.length ? (
              <div className="mt-2 space-y-1">
                {message.citations.slice(0, 3).map((citation) => (
                  <p
                    key={citation.chunkId}
                    className="text-[11px] text-[var(--muted)]"
                  >
                    {citation.sourceTitle} · score {citation.score}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        className="border-t border-[var(--border)] p-4"
        onSubmit={(event) => {
          event.preventDefault();
          ask(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask your Knowledge Twin…"
          className="min-h-[88px] resize-none"
        />
        <div className="mt-3 flex items-center justify-between gap-2">
          <VoiceAskButton
            conversationId={conversationId}
            organizationId={organizationId}
            enabled={voiceEnabled && !ownerUserId}
            onResult={(result) => {
              setConversationId(result.conversationId);
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "USER",
                  content: result.transcript || "(voice)",
                },
                {
                  id: crypto.randomUUID(),
                  role: "ASSISTANT",
                  content: result.answer,
                  confidence: result.confidence,
                },
              ]);
            }}
          />
          <Button type="submit" disabled={!canSend}>
            {isPending ? "Streaming…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
