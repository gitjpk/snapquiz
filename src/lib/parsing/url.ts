/**
 * URL Content Extraction Module
 * Reference: specs/004-ai-quiz-generation/research.md
 * 
 * Uses jsdom + @mozilla/readability for intelligent content extraction
 */

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import robotsParser from "robots-parser";

// User agent for fetch requests
const USER_AGENT = "SnapQuiz/1.0 (Educational Quiz Generator)";

// Request timeout (10 seconds)
const REQUEST_TIMEOUT = 10000;

// Minimum word count for valid content
const MIN_WORD_COUNT = 50;

export interface ExtractedContent {
  title: string | null;
  content: string;
  wordCount: number;
  url: string;
  excerpt: string | null;
}

export interface ExtractionError {
  code: "FETCH_ERROR" | "BLOCKED" | "NO_CONTENT" | "TIMEOUT" | "INVALID_URL";
  message: string;
}

/**
 * Validate URL format and protocol
 */
export function validateUrl(urlString: string): ExtractionError | null {
  try {
    const url = new URL(urlString);
    
    if (!["http:", "https:"].includes(url.protocol)) {
      return {
        code: "INVALID_URL",
        message: "Only HTTP and HTTPS URLs are supported",
      };
    }
    
    return null;
  } catch {
    return {
      code: "INVALID_URL",
      message: "Invalid URL format",
    };
  }
}

/**
 * Check robots.txt for crawling permission
 */
export async function checkRobotsTxt(
  urlString: string
): Promise<{ allowed: boolean; crawlDelay?: number }> {
  try {
    const url = new URL(urlString);
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(robotsUrl, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
      
      if (!response.ok) {
        // No robots.txt or error - assume allowed
        return { allowed: true };
      }
      
      const robotsTxt = await response.text();
      const robots = robotsParser(robotsUrl, robotsTxt);
      
      const allowed = robots.isAllowed(urlString, USER_AGENT) ?? true;
      const crawlDelay = robots.getCrawlDelay(USER_AGENT);
      
      return {
        allowed,
        crawlDelay: crawlDelay ?? undefined,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    // Error checking robots.txt - assume allowed
    return { allowed: true };
  }
}

/**
 * Fetch and extract content from a URL
 */
export async function extractUrlContent(
  urlString: string,
  options: { skipRobotsCheck?: boolean } = {}
): Promise<ExtractedContent | ExtractionError> {
  // Validate URL
  const validationError = validateUrl(urlString);
  if (validationError) {
    return validationError;
  }

  // Check robots.txt
  if (!options.skipRobotsCheck) {
    const robotsResult = await checkRobotsTxt(urlString);
    if (!robotsResult.allowed) {
      return {
        code: "BLOCKED",
        message: "This website does not allow automated access according to robots.txt",
      };
    }
  }

  // Fetch the page
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(urlString, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        return {
          code: "BLOCKED",
          message: "Access to this page is restricted",
        };
      }
      if (response.status === 404) {
        return {
          code: "FETCH_ERROR",
          message: "Page not found",
        };
      }
      return {
        code: "FETCH_ERROR",
        message: `Failed to fetch page: ${response.status} ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Parse with jsdom
    const dom = new JSDOM(html, {
      url: urlString,
    });

    // Extract with Readability
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return {
        code: "NO_CONTENT",
        message: "Could not extract readable content from this page",
      };
    }

    // Clean and validate content
    const content = cleanContent(article.textContent);
    const wordCount = countWords(content);

    if (wordCount < MIN_WORD_COUNT) {
      return {
        code: "NO_CONTENT",
        message: `Page has insufficient content (${wordCount} words, minimum ${MIN_WORD_COUNT})`,
      };
    }

    return {
      title: article.title || null,
      content,
      wordCount,
      url: urlString,
      excerpt: article.excerpt || null,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      return {
        code: "TIMEOUT",
        message: "Request timed out while fetching page",
      };
    }

    console.error("URL extraction error:", error);
    return {
      code: "FETCH_ERROR",
      message: "Failed to fetch page content",
    };
  }
}

/**
 * Clean extracted text content
 */
function cleanContent(content: string): string {
  return content
    // Normalize whitespace
    .replace(/\s+/g, " ")
    // Remove citation markers
    .replace(/\[\d+\]/g, "")
    .replace(/\[edit\]/gi, "")
    .replace(/\[citation needed\]/gi, "")
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
 * Truncate content for LLM token budget
 */
export function truncateUrlContent(content: string, maxChars = 50000): string {
  if (content.length <= maxChars) {
    return content;
  }

  // Try to truncate at a sentence boundary
  const truncated = content.substring(0, maxChars);
  const lastSentence = truncated.lastIndexOf(". ");
  
  if (lastSentence > maxChars * 0.7) {
    return truncated.substring(0, lastSentence + 1) + "\n\n[Content truncated...]";
  }

  return truncated + "\n\n[Content truncated...]";
}
