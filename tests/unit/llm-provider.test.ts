import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenAIProvider } from "@/lib/llm/providers/openai";
import { AnthropicProvider } from "@/lib/llm/providers/anthropic";
import { LLMError, mapStatusToErrorCode } from "@/lib/llm/errors";
import { parseGenerationResponse } from "@/lib/llm/prompts";

describe("LLM Provider Abstraction", () => {
  describe("OpenAIProvider", () => {
    let provider: OpenAIProvider;

    beforeEach(() => {
      provider = new OpenAIProvider("https://api.openai.com", "test-key");
    });

    it("has correct name", () => {
      expect(provider.name).toBe("openai");
    });

    it("normalizes endpoint URL", () => {
      const providerWithSlash = new OpenAIProvider(
        "https://api.openai.com/",
        "test-key"
      );
      expect(providerWithSlash.name).toBe("openai");
    });
  });

  describe("AnthropicProvider", () => {
    let provider: AnthropicProvider;

    beforeEach(() => {
      provider = new AnthropicProvider("https://api.anthropic.com", "test-key");
    });

    it("has correct name", () => {
      expect(provider.name).toBe("anthropic");
    });
  });

  describe("LLMError", () => {
    it("creates error with all properties", () => {
      const error = new LLMError({
        code: "authentication",
        message: "Invalid API key",
        retryable: false,
        statusCode: 401,
        provider: "openai",
      });

      expect(error.code).toBe("authentication");
      expect(error.message).toBe("Invalid API key");
      expect(error.retryable).toBe(false);
      expect(error.statusCode).toBe(401);
      expect(error.provider).toBe("openai");
      expect(error.name).toBe("LLMError");
    });

    it("provides user-friendly messages", () => {
      const authError = new LLMError({
        code: "authentication",
        message: "Test",
        retryable: false,
      });
      expect(authError.toUserMessage()).toContain("API key");

      const rateLimitError = new LLMError({
        code: "rate_limited",
        message: "Test",
        retryable: true,
      });
      expect(rateLimitError.toUserMessage()).toContain("Too many requests");

      const serverError = new LLMError({
        code: "server_error",
        message: "Test",
        retryable: true,
      });
      expect(serverError.toUserMessage()).toContain("experiencing issues");
    });
  });

  describe("mapStatusToErrorCode", () => {
    it("maps 400 to invalid_request", () => {
      const result = mapStatusToErrorCode(400, "openai");
      expect(result.code).toBe("invalid_request");
      expect(result.retryable).toBe(false);
    });

    it("maps 401/403 to authentication", () => {
      expect(mapStatusToErrorCode(401, "openai").code).toBe("authentication");
      expect(mapStatusToErrorCode(403, "openai").code).toBe("authentication");
    });

    it("maps 429 to rate_limited", () => {
      const result = mapStatusToErrorCode(429, "openai");
      expect(result.code).toBe("rate_limited");
      expect(result.retryable).toBe(true);
    });

    it("maps 5xx to server_error", () => {
      expect(mapStatusToErrorCode(500, "openai").code).toBe("server_error");
      expect(mapStatusToErrorCode(502, "openai").code).toBe("server_error");
      expect(mapStatusToErrorCode(503, "openai").code).toBe("server_error");
    });

    it("maps 529 to overloaded (Anthropic)", () => {
      const result = mapStatusToErrorCode(529, "anthropic");
      expect(result.code).toBe("overloaded");
      expect(result.retryable).toBe(true);
    });
  });

  describe("parseGenerationResponse", () => {
    it("parses valid JSON response", () => {
      const response = JSON.stringify({
        questions: [
          {
            question: "What is 2+2?",
            options: ["3", "4", "5", "6"],
            correctAnswer: 1,
            explanation: "Basic math",
          },
        ],
      });

      const result = parseGenerationResponse(response);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].question).toBe("What is 2+2?");
      expect(result.questions[0].correctAnswer).toBe(1);
    });

    it("handles markdown code blocks", () => {
      const response = `
\`\`\`json
{
  "questions": [
    {
      "question": "Test?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Test"
    }
  ]
}
\`\`\`
`;

      const result = parseGenerationResponse(response);
      expect(result.questions).toHaveLength(1);
    });

    it("validates question structure", () => {
      const invalidResponse = JSON.stringify({
        questions: [
          {
            question: "Test?",
            options: ["A", "B"], // Only 2 options
            correctAnswer: 0,
          },
        ],
      });

      expect(() => parseGenerationResponse(invalidResponse)).toThrow(
        "must have exactly 4 options"
      );
    });

    it("validates correctAnswer range", () => {
      const invalidResponse = JSON.stringify({
        questions: [
          {
            question: "Test?",
            options: ["A", "B", "C", "D"],
            correctAnswer: 5, // Invalid index
          },
        ],
      });

      expect(() => parseGenerationResponse(invalidResponse)).toThrow(
        "correctAnswer must be 0, 1, 2, or 3"
      );
    });

    it("rejects missing questions array", () => {
      const invalidResponse = JSON.stringify({ data: [] });

      expect(() => parseGenerationResponse(invalidResponse)).toThrow(
        "must contain a 'questions' array"
      );
    });

    it("trims whitespace from options", () => {
      const response = JSON.stringify({
        questions: [
          {
            question: "Test?",
            options: [" A ", " B ", " C ", " D "],
            correctAnswer: 0,
          },
        ],
      });

      const result = parseGenerationResponse(response);
      expect(result.questions[0].options).toEqual(["A", "B", "C", "D"]);
    });

    it("preserves explanation field", () => {
      const response = JSON.stringify({
        questions: [
          {
            question: "What is the capital of France?",
            options: ["London", "Berlin", "Paris", "Madrid"],
            correctAnswer: 2,
            explanation: "Paris has been the capital since 987 AD.",
          },
        ],
      });

      const result = parseGenerationResponse(response);
      expect(result.questions[0].explanation).toBe(
        "Paris has been the capital since 987 AD."
      );
    });
  });
});
