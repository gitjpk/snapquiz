/**
 * Unit tests for URL content extraction
 * Reference: specs/004-ai-quiz-generation/research.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateUrl,
  truncateUrlContent,
} from "../../src/lib/parsing/url";

describe("URL Extraction", () => {
  describe("validateUrl", () => {
    it("should accept valid HTTPS URLs", () => {
      expect(validateUrl("https://example.com/page")).toBeNull();
      expect(validateUrl("https://www.example.com/path?query=1")).toBeNull();
    });

    it("should accept valid HTTP URLs", () => {
      expect(validateUrl("http://example.com")).toBeNull();
    });

    it("should reject non-HTTP protocols", () => {
      const result = validateUrl("ftp://example.com");
      expect(result).not.toBeNull();
      expect(result?.code).toBe("INVALID_URL");
    });

    it("should reject file:// protocol", () => {
      const result = validateUrl("file:///etc/passwd");
      expect(result).not.toBeNull();
      expect(result?.code).toBe("INVALID_URL");
    });

    it("should reject javascript: protocol", () => {
      const result = validateUrl("javascript:alert(1)");
      expect(result).not.toBeNull();
      expect(result?.code).toBe("INVALID_URL");
    });

    it("should reject invalid URL format", () => {
      expect(validateUrl("not-a-url")?.code).toBe("INVALID_URL");
      expect(validateUrl("example.com")?.code).toBe("INVALID_URL");
      expect(validateUrl("")?.code).toBe("INVALID_URL");
    });
  });

  describe("truncateUrlContent", () => {
    it("should not truncate short content", () => {
      const content = "Short content here.";
      expect(truncateUrlContent(content, 100)).toBe(content);
    });

    it("should truncate at sentence boundary when possible", () => {
      const content = "First sentence. Second sentence. Third sentence is very long and goes beyond the limit here.";
      const result = truncateUrlContent(content, 50);
      expect(result).toContain("First sentence.");
      expect(result).toContain("[Content truncated...]");
    });

    it("should hard truncate when no good sentence boundary", () => {
      const content = "A".repeat(200);
      const result = truncateUrlContent(content, 100);
      expect(result.length).toBeLessThan(150); // 100 + truncation message
      expect(result).toContain("[Content truncated...]");
    });

    it("should use default maxChars of 15000", () => {
      const longContent = "A".repeat(20000);
      const result = truncateUrlContent(longContent);
      // Content is truncated, but includes the message
      expect(result.length).toBeLessThan(16000);
      expect(result).toContain("[Content truncated...]");
    });
  });

  describe("extractUrlContent integration tests", () => {
    // These tests require mocking fetch and would be run against real URLs in E2E tests
    // For unit tests, we validate the utility functions above

    it("should export all required functions", async () => {
      const parsing = await import("../../src/lib/parsing");
      expect(typeof parsing.extractUrlContent).toBe("function");
      expect(typeof parsing.validateUrl).toBe("function");
      expect(typeof parsing.checkRobotsTxt).toBe("function");
      expect(typeof parsing.truncateUrlContent).toBe("function");
    });
  });
});
