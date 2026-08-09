"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VoiceAskButtonProps = {
  conversationId: string | null;
  organizationId?: string | null;
  enabled?: boolean;
  onResult: (result: {
    transcript: string;
    answer: string;
    conversationId: string;
    confidence: number;
    audioUrl: string;
  }) => void;
};

function ListeningDots({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-hidden
    >
      <span className="animate-live-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
      <span className="animate-live-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)] [animation-delay:0.2s]" />
      <span className="animate-live-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)] [animation-delay:0.4s]" />
    </span>
  );
}

export function VoiceAskButton({
  conversationId,
  organizationId = null,
  enabled = true,
  onResult,
}: VoiceAskButtonProps) {
  const [recording, setRecording] = useState(false);
  const [isPending, startTransition] = useTransition();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    if (!enabled) {
      toast.error("Voice Twin requires a Pro or Business plan");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        upload(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error("Microphone permission is required for Voice Twin");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function upload(blob: Blob) {
    startTransition(async () => {
      try {
        const form = new FormData();
        form.append("audio", blob, "voice.webm");
        if (conversationId) form.append("conversationId", conversationId);
        if (organizationId) form.append("organizationId", organizationId);

        const response = await fetch("/api/v1/voice/ask", {
          method: "POST",
          body: form,
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
              : "Voice ask failed";
          throw new Error(message);
        }

        const transcript = decodeURIComponent(
          response.headers.get("X-Smitvi-Transcript") ?? "",
        );
        const answer = decodeURIComponent(
          response.headers.get("X-Smitvi-Answer") ?? "",
        );
        const nextConversationId =
          response.headers.get("X-Smitvi-Conversation-Id") ?? conversationId ?? "";
        const confidence = Number(
          response.headers.get("X-Smitvi-Confidence") ?? "0",
        );
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        onResult({
          transcript,
          answer,
          conversationId: nextConversationId,
          confidence,
          audioUrl,
        });

        const audio = new Audio(audioUrl);
        void audio.play();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Voice ask failed");
      }
    });
  }

  const listening = recording || isPending;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={isPending}
      aria-label={
        recording
          ? "Listening — tap to stop"
          : isPending
            ? "Processing voice"
            : "Ask with voice"
      }
      title={
        recording
          ? "Listening — tap to stop"
          : isPending
            ? "Processing voice"
            : "Ask with voice"
      }
      className={cn(
        listening &&
          "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/15",
      )}
      onClick={() => (recording ? stopRecording() : void startRecording())}
    >
      {listening ? <ListeningDots /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
