export const EMBEDDING_MODEL = "text-embedding-3-small" as const;
export const EMBEDDING_DIMENSIONS = 1536 as const;
export const CHAT_MODEL = "gpt-4.1-mini" as const;
export const TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe" as const;
export const SPEECH_MODEL = "gpt-4o-mini-tts" as const;
export const SPEECH_VOICE = "coral" as const;

/** Minimum cosine similarity to treat a chunk as supporting evidence. */
export const RETRIEVAL_MIN_SCORE = 0.28;
/** Top-chunk average score shown on answers; see ask-twin confidence logic. */
export const ANSWER_MIN_CONFIDENCE = 0.30;
/** Best matching chunk must reach this before the model is called. */
export const ANSWER_MIN_TOP_SCORE = 0.30;
export const RETRIEVAL_TOP_K = 6;
export const CHUNK_SIZE_CHARS = 1200;
export const CHUNK_OVERLAP_CHARS = 180;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const LOW_CONFIDENCE_REPLY = "I don't know.";
