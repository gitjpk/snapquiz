/**
 * Document Parsing Module
 * Reference: specs/004-ai-quiz-generation/research.md
 * 
 * Supports: PDF, DOCX, PPTX, TXT
 */

import { parseOffice } from "officeparser";
import { extractText } from "unpdf";

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Supported MIME types
const SUPPORTED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
};

// Magic bytes for file type validation
const MAGIC_BYTES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  zip: [0x50, 0x4b, 0x03, 0x04], // PK.. (DOCX, PPTX are ZIP archives)
};

export interface ParsedDocument {
  content: string;
  wordCount: number;
  filename: string;
  format: string;
}

export interface ParseDocumentError {
  code: "UNSUPPORTED_FORMAT" | "FILE_TOO_LARGE" | "PARSE_ERROR" | "EMPTY_DOCUMENT" | "INVALID_FILE";
  message: string;
}

/**
 * Validate file before parsing
 */
export function validateFile(
  buffer: Buffer,
  filename: string
): ParseDocumentError | null {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      code: "FILE_TOO_LARGE",
      message: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check extension
  const ext = filename.toLowerCase().split(".").pop();
  const supportedExtensions = Object.values(SUPPORTED_TYPES).flat();
  if (!ext || !supportedExtensions.includes(`.${ext}`)) {
    return {
      code: "UNSUPPORTED_FORMAT",
      message: `Unsupported file format: .${ext}. Supported: PDF, DOCX, PPTX, TXT`,
    };
  }

  // Validate magic bytes
  if (ext === "pdf") {
    if (!checkMagicBytes(buffer, MAGIC_BYTES.pdf)) {
      return {
        code: "INVALID_FILE",
        message: "File does not appear to be a valid PDF",
      };
    }
  } else if (["docx", "pptx"].includes(ext)) {
    if (!checkMagicBytes(buffer, MAGIC_BYTES.zip)) {
      return {
        code: "INVALID_FILE",
        message: `File does not appear to be a valid ${ext.toUpperCase()}`,
      };
    }
  }

  return null;
}

/**
 * Check if buffer starts with expected magic bytes
 */
function checkMagicBytes(buffer: Buffer, expected: number[]): boolean {
  if (buffer.length < expected.length) return false;
  return expected.every((byte, i) => buffer[i] === byte);
}

/**
 * Parse PDF using unpdf
 */
async function parsePdf(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const { text } = await extractText(data);
  // text can be string or string[], join if array
  return Array.isArray(text) ? text.join("\n") : text;
}

/**
 * Parse a document and extract text content
 */
export async function parseDocument(
  buffer: Buffer,
  filename: string
): Promise<ParsedDocument | ParseDocumentError> {
  // Validate first
  const validationError = validateFile(buffer, filename);
  if (validationError) {
    return validationError;
  }

  const ext = filename.toLowerCase().split(".").pop();

  try {
    let content: string;

    if (ext === "txt") {
      // Plain text - just decode
      content = buffer.toString("utf-8");
    } else if (ext === "pdf") {
      // Use unpdf for PDFs
      content = await parsePdf(buffer);
    } else {
      // Use officeparser for DOCX, PPTX
      const result = await parseOffice(buffer, {
        outputErrorToConsole: false,
      });
      // officeparser returns an object with toText() method for extracting text
      if (typeof result === "string") {
        content = result;
      } else if (result && typeof result === "object") {
        // Use toText() method if available (newer officeparser versions)
        if (typeof (result as { toText?: () => string }).toText === "function") {
          content = (result as { toText: () => string }).toText();
        } else if ((result as { content?: unknown }).content) {
          // Fallback: content might be an array of slides/paragraphs
          const contentData = (result as { content: unknown }).content;
          if (Array.isArray(contentData)) {
            content = contentData
              .map((item) => (typeof item === "string" ? item : (item as { text?: string })?.text || ""))
              .filter(Boolean)
              .join("\n");
          } else {
            content = String(contentData || "");
          }
        } else {
          content = "";
        }
        // Debug: log office parser result type
        if (process.env.NODE_ENV !== "production") {
          console.warn("[Document Parse] officeparser returned object:", typeof result, Object.keys(result as object));
        }
      } else {
        content = "";
      }
    }

    // Ensure content is a string
    if (typeof content !== "string") {
      content = String(content || "");
    }

    // Clean up content
    content = cleanContent(content);

    // Check if document has content
    const wordCount = countWords(content);
    // Debug: log extraction results
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Document Parse] File: ${filename}, Words extracted: ${wordCount}`);
    }
    
    if (wordCount < 10) {
      const formatName = ext?.toUpperCase() || "document";
      const hint = ext === "pdf" 
        ? "If this is a scanned PDF, please use a PDF with selectable text."
        : `Please ensure the ${formatName} file contains readable text content.`;
      return {
        code: "EMPTY_DOCUMENT",
        message: `Document appears empty or has insufficient content. ${hint}`,
      };
    }

    return {
      content,
      wordCount,
      filename,
      format: ext?.toUpperCase() || "UNKNOWN",
    };
  } catch (error) {
    console.error("Document parsing error:", error);
    
    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("password") || errorMessage.includes("encrypted")) {
      return {
        code: "PARSE_ERROR",
        message: "Document is password-protected and cannot be read",
      };
    }
    
    if (errorMessage.includes("corrupt") || errorMessage.includes("invalid")) {
      return {
        code: "PARSE_ERROR",
        message: "Document appears to be corrupted",
      };
    }

    return {
      code: "PARSE_ERROR",
      message: "Failed to parse document. Please ensure it is a valid file.",
    };
  }
}

/**
 * Clean extracted text content
 */
function cleanContent(content: string): string {
  return content
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove excessive whitespace
    .replace(/[ \t]+/g, " ")
    // Remove excessive blank lines
    .replace(/\n{3,}/g, "\n\n")
    // Remove citation markers like [1], [edit], etc.
    .replace(/\[\d+\]/g, "")
    .replace(/\[edit\]/gi, "")
    // Trim
    .trim();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Truncate content to fit within token budget
 * Approximately 4 chars = 1 token, so 15000 chars ≈ 3750 tokens
 */
export function truncateContent(content: string, maxChars = 50000): string {
  if (content.length <= maxChars) {
    return content;
  }

  // Try to truncate at a paragraph boundary
  const truncated = content.substring(0, maxChars);
  const lastParagraph = truncated.lastIndexOf("\n\n");
  
  if (lastParagraph > maxChars * 0.7) {
    return truncated.substring(0, lastParagraph) + "\n\n[Content truncated...]";
  }

  // Fall back to sentence boundary
  const lastSentence = truncated.lastIndexOf(". ");
  if (lastSentence > maxChars * 0.7) {
    return truncated.substring(0, lastSentence + 1) + "\n\n[Content truncated...]";
  }

  return truncated + "\n\n[Content truncated...]";
}
