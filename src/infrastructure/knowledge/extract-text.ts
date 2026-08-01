import mammoth from "mammoth";
import type { KnowledgeSourceType } from "@/domain/knowledge/entities";
import { ValidationError } from "@/domain/shared/errors";

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
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result.text.trim();
      } finally {
        await parser.destroy();
      }
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
