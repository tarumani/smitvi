import {
  SPEECH_MODEL,
  SPEECH_VOICE,
  TRANSCRIPTION_MODEL,
} from "@/config/ai";
import { getOpenAIClient } from "@/infrastructure/ai/openai-client";
import { ValidationError } from "@/domain/shared/errors";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function transcribeAudio(input: {
  bytes: Buffer;
  fileName: string;
  mimeType: string | null;
}): Promise<string> {
  if (!input.bytes.length) {
    throw new ValidationError("Empty audio upload");
  }
  if (input.bytes.length > MAX_AUDIO_BYTES) {
    throw new ValidationError("Audio exceeds the 25MB limit");
  }

  const openai = getOpenAIClient();
  const file = new File([new Uint8Array(input.bytes)], input.fileName, {
    type: input.mimeType ?? "audio/webm",
  });

  const result = await openai.audio.transcriptions.create({
    file,
    model: TRANSCRIPTION_MODEL,
  });

  const text = result.text?.trim() ?? "";
  if (!text) {
    throw new ValidationError("Could not transcribe audio");
  }
  return text;
}

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new ValidationError("Nothing to speak");
  }

  const openai = getOpenAIClient();
  const response = await openai.audio.speech.create({
    model: SPEECH_MODEL,
    voice: SPEECH_VOICE,
    input: trimmed.slice(0, 4096),
    response_format: "mp3",
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
