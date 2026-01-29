import { describe, it, expect, vi } from "vitest";
import {
  validateFile,
  truncateContent,
} from "@/lib/parsing/document";

describe("Document Parsing", () => {
  describe("validateFile", () => {
    it("rejects files exceeding 10MB", () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const result = validateFile(largeBuffer, "large.pdf");
      
      expect(result).not.toBeNull();
      expect(result?.code).toBe("FILE_TOO_LARGE");
    });

    it("accepts files under 10MB", () => {
      // Create a valid PDF-like buffer (starts with %PDF magic bytes)
      const validBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, ...Buffer.alloc(1000)]);
      const result = validateFile(validBuffer, "test.pdf");
      
      expect(result).toBeNull();
    });

    it("rejects unsupported file extensions", () => {
      const buffer = Buffer.from("test content");
      const result = validateFile(buffer, "test.exe");
      
      expect(result).not.toBeNull();
      expect(result?.code).toBe("UNSUPPORTED_FORMAT");
    });

    it("accepts supported file extensions", () => {
      // PDF with magic bytes
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, ...Buffer.alloc(100)]);
      expect(validateFile(pdfBuffer, "test.pdf")).toBeNull();
      
      // DOCX (ZIP magic bytes)
      const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Buffer.alloc(100)]);
      expect(validateFile(docxBuffer, "test.docx")).toBeNull();
      
      // PPTX (ZIP magic bytes)
      const pptxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Buffer.alloc(100)]);
      expect(validateFile(pptxBuffer, "test.pptx")).toBeNull();
      
      // TXT (no magic bytes required)
      const txtBuffer = Buffer.from("test content");
      expect(validateFile(txtBuffer, "test.txt")).toBeNull();
    });

    it("validates PDF magic bytes", () => {
      const invalidPdf = Buffer.from("not a pdf file");
      const result = validateFile(invalidPdf, "fake.pdf");
      
      expect(result).not.toBeNull();
      expect(result?.code).toBe("INVALID_FILE");
    });

    it("validates DOCX magic bytes (ZIP format)", () => {
      const invalidDocx = Buffer.from("not a docx file");
      const result = validateFile(invalidDocx, "fake.docx");
      
      expect(result).not.toBeNull();
      expect(result?.code).toBe("INVALID_FILE");
    });
  });

  describe("truncateContent", () => {
    it("returns content unchanged if under limit", () => {
      const content = "Short content";
      const result = truncateContent(content, 1000);
      
      expect(result).toBe(content);
    });

    it("truncates content at paragraph boundary when possible", () => {
      // Create content that's definitely longer than the truncation limit
      const longParagraph = "This is a very long paragraph. ".repeat(100);
      const content = `First paragraph.\n\n${longParagraph}\n\nThird paragraph.`;
      const result = truncateContent(content, 500);
      
      expect(result).toContain("[Content truncated...]");
      expect(result.length).toBeLessThan(content.length);
    });

    it("falls back to sentence boundary if no paragraph", () => {
      const content = "First sentence. Second sentence. Third sentence that goes on and on.";
      const result = truncateContent(content, 50);
      
      expect(result).toContain("[Content truncated...]");
    });

    it("uses default max chars of 15000", () => {
      const content = "x".repeat(20000);
      const result = truncateContent(content);
      
      expect(result.length).toBeLessThan(20000);
      expect(result).toContain("[Content truncated...]");
    });
  });

  describe("parseDocument", () => {
    // Note: Full parseDocument tests would require mocking officeparser
    // These are covered by integration tests
    
    it("handles txt files directly", async () => {
      const { parseDocument } = await import("@/lib/parsing/document");
      const content = "This is a test document with enough words to pass validation. ".repeat(5);
      const buffer = Buffer.from(content);
      
      const result = await parseDocument(buffer, "test.txt");
      
      if ("code" in result) {
        throw new Error(`Unexpected error: ${result.message}`);
      }
      
      expect(result.content).toContain("test document");
      expect(result.filename).toBe("test.txt");
      expect(result.format).toBe("TXT");
      expect(result.wordCount).toBeGreaterThan(10);
    });

    it("rejects empty documents", async () => {
      const { parseDocument } = await import("@/lib/parsing/document");
      const buffer = Buffer.from("   ");
      
      const result = await parseDocument(buffer, "empty.txt");
      
      expect("code" in result).toBe(true);
      if ("code" in result) {
        expect(result.code).toBe("EMPTY_DOCUMENT");
      }
    });
  });
});
