import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import mammoth from "mammoth";
import type { KnowledgeSourceType } from "@/domain/knowledge/entities";
import { ValidationError } from "@/domain/shared/errors";

const require = createRequire(path.join(process.cwd(), "package.json"));
let pdfWorkerConfigured = false;

function configurePdfWorker(PDFParse: {
  setWorker: (workerSrc?: string) => string;
}) {
  if (pdfWorkerConfigured) return;
  try {
    const workerPath = require.resolve(
      "pdfjs-dist/legacy/build/pdf.worker.mjs",
    );
    PDFParse.setWorker(pathToFileURL(workerPath).href);
    pdfWorkerConfigured = true;
  } catch {
    try {
      const fallback = require.resolve(
        "pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs",
      );
      PDFParse.setWorker(pathToFileURL(fallback).href);
      pdfWorkerConfigured = true;
    } catch {
      // leave unset — getText may still work in some Node environments
    }
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  configurePdfWorker(PDFParse);

  // Copy bytes — pdf.js may transfer TypedArray ownership to the worker.
  const data = Uint8Array.from(buffer);
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    const text = result.text.trim();
    if (!text) {
      throw new ValidationError(
        "No readable text found in this PDF. Try a text-based PDF (not a scanned image).",
      );
    }
    return text;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF extraction failed";
    if (/fake worker|pdf\.worker|Cannot find module/i.test(message)) {
      throw new ValidationError(
        "PDF processing is temporarily unavailable on the server. Please try again in a moment, or upload TXT/Markdown.",
      );
    }
    if (error instanceof ValidationError) throw error;
    throw new ValidationError(`Could not read this PDF: ${message}`);
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

export async function extractTextFromFile(
  buffer: Buffer,
  type: KnowledgeSourceType,
): Promise<string> {
  switch (type) {
    case "TXT":
    case "MARKDOWN": {
      return buffer.toString("utf8").trim();
    }
    case "PDF": {
      return extractPdfText(buffer);
    }
    case "DOCX": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    }
    case "PPTX": {
      // PPTX is a zip of XML; extract readable text nodes as a pragmatic Sprint 2 path.
      const asString = buffer.toString("utf8");
      const matches = asString.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) ?? [];
      const text = matches
        .map((node) => node.replace(/<\/?a:t[^>]*>/g, ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (!text) {
        throw new ValidationError(
          "Could not extract text from this PowerPoint file.",
        );
      }
      return text;
    }
    default:
      throw new ValidationError(
        `Text extraction for ${type} is not enabled in Sprint 2 yet.`,
      );
  }
}
