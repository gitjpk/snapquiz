import { describe, it, expect } from "vitest";
import {
  LLMSettingsInputSchema,
  GenerateQuizRequestSchema,
  GeneratedQuestionSchema,
  TestConnectionRequestSchema,
  LLMProviderSchema,
  DifficultyLevelSchema,
  GenerationSourceSchema,
} from "@/lib/validation/llmSchemas";

describe("LLM Validation Schemas", () => {
  describe("LLMProviderSchema", () => {
    it("accepts valid providers", () => {
      expect(LLMProviderSchema.safeParse("openai").success).toBe(true);
      expect(LLMProviderSchema.safeParse("anthropic").success).toBe(true);
    });

    it("rejects invalid providers", () => {
      expect(LLMProviderSchema.safeParse("gemini").success).toBe(false);
      expect(LLMProviderSchema.safeParse("").success).toBe(false);
      expect(LLMProviderSchema.safeParse(123).success).toBe(false);
    });
  });

  describe("DifficultyLevelSchema", () => {
    it("accepts valid difficulty levels", () => {
      expect(DifficultyLevelSchema.safeParse("easy").success).toBe(true);
      expect(DifficultyLevelSchema.safeParse("medium").success).toBe(true);
      expect(DifficultyLevelSchema.safeParse("hard").success).toBe(true);
    });

    it("rejects invalid difficulty levels", () => {
      expect(DifficultyLevelSchema.safeParse("very_hard").success).toBe(false);
      expect(DifficultyLevelSchema.safeParse("").success).toBe(false);
    });
  });

  describe("LLMSettingsInputSchema", () => {
    it("validates correct settings", () => {
      const validSettings = {
        provider: "openai",
        apiEndpoint: "https://api.openai.com",
        apiKey: "sk-test123",
      };

      const result = LLMSettingsInputSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it("requires HTTPS for apiEndpoint", () => {
      const httpSettings = {
        provider: "openai",
        apiEndpoint: "http://api.openai.com",
        apiKey: "sk-test123",
      };

      const result = LLMSettingsInputSchema.safeParse(httpSettings);
      expect(result.success).toBe(false);
    });

    it("accepts empty API key (for local proxies)", () => {
      const emptyKey = {
        provider: "openai",
        apiEndpoint: "https://api.openai.com",
        apiKey: "",
      };

      const result = LLMSettingsInputSchema.safeParse(emptyKey);
      expect(result.success).toBe(true);
    });

    it("accepts HTTP for localhost", () => {
      const localSettings = {
        provider: "openai",
        apiEndpoint: "http://127.0.0.1:4000",
        apiKey: "",
      };

      const result = LLMSettingsInputSchema.safeParse(localSettings);
      expect(result.success).toBe(true);
    });

    it("rejects invalid URL", () => {
      const invalidUrl = {
        provider: "openai",
        apiEndpoint: "not-a-url",
        apiKey: "sk-test123",
      };

      const result = LLMSettingsInputSchema.safeParse(invalidUrl);
      expect(result.success).toBe(false);
    });
  });

  describe("TestConnectionRequestSchema", () => {
    it("validates correct test request", () => {
      const valid = {
        provider: "anthropic",
        apiEndpoint: "https://api.anthropic.com",
        apiKey: "sk-ant-test123",
      };

      const result = TestConnectionRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("GenerationSourceSchema", () => {
    it("validates topic source", () => {
      const topicSource = {
        type: "topic",
        value: "World War II History",
      };

      const result = GenerationSourceSchema.safeParse(topicSource);
      expect(result.success).toBe(true);
    });

    it("validates URL source with http", () => {
      const urlSource = {
        type: "url",
        value: "http://example.com/article",
      };

      const result = GenerationSourceSchema.safeParse(urlSource);
      expect(result.success).toBe(true);
    });

    it("validates URL source with https", () => {
      const urlSource = {
        type: "url",
        value: "https://example.com/article",
      };

      const result = GenerationSourceSchema.safeParse(urlSource);
      expect(result.success).toBe(true);
    });

    it("validates document source", () => {
      const documentSource = {
        type: "document",
        value: "lecture-notes.pdf",
      };

      const result = GenerationSourceSchema.safeParse(documentSource);
      expect(result.success).toBe(true);
    });

    it("rejects empty topic", () => {
      const emptyTopic = {
        type: "topic",
        value: "",
      };

      const result = GenerationSourceSchema.safeParse(emptyTopic);
      expect(result.success).toBe(false);
    });

    it("rejects invalid URL", () => {
      const invalidUrl = {
        type: "url",
        value: "not-a-url",
      };

      const result = GenerationSourceSchema.safeParse(invalidUrl);
      expect(result.success).toBe(false);
    });

    it("rejects non-http/https URL protocols", () => {
      const ftpUrl = {
        type: "url",
        value: "ftp://example.com/file",
      };

      const result = GenerationSourceSchema.safeParse(ftpUrl);
      expect(result.success).toBe(false);
    });
  });

  describe("GenerateQuizRequestSchema", () => {
    it("validates correct generation request", () => {
      const validRequest = {
        source: {
          type: "topic",
          value: "Machine Learning Basics",
        },
        questionCount: 5,
        difficulty: "medium",
      };

      const result = GenerateQuizRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("rejects questionCount below 1", () => {
      const invalid = {
        source: { type: "topic", value: "Test" },
        questionCount: 0,
        difficulty: "easy",
      };

      const result = GenerateQuizRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects questionCount above 20", () => {
      const invalid = {
        source: { type: "topic", value: "Test" },
        questionCount: 21,
        difficulty: "easy",
      };

      const result = GenerateQuizRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects non-integer questionCount", () => {
      const invalid = {
        source: { type: "topic", value: "Test" },
        questionCount: 5.5,
        difficulty: "easy",
      };

      const result = GenerateQuizRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("GeneratedQuestionSchema", () => {
    it("validates correct generated question", () => {
      const validQuestion = {
        prompt: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctOptionIndex: 2,
        timeLimitSeconds: 30,
        explanation: "Paris is the capital city of France.",
      };

      const result = GeneratedQuestionSchema.safeParse(validQuestion);
      expect(result.success).toBe(true);
    });

    it("applies default time limit", () => {
      const questionWithoutTime = {
        prompt: "Test question?",
        options: ["A", "B", "C", "D"],
        correctOptionIndex: 0,
      };

      const result = GeneratedQuestionSchema.safeParse(questionWithoutTime);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeLimitSeconds).toBe(30);
      }
    });

    it("requires exactly 4 options", () => {
      const threeOptions = {
        prompt: "Test?",
        options: ["A", "B", "C"],
        correctOptionIndex: 0,
        timeLimitSeconds: 30,
      };

      const result = GeneratedQuestionSchema.safeParse(threeOptions);
      expect(result.success).toBe(false);
    });

    it("rejects correctOptionIndex outside 0-3 range", () => {
      const invalidIndex = {
        prompt: "Test?",
        options: ["A", "B", "C", "D"],
        correctOptionIndex: 4,
        timeLimitSeconds: 30,
      };

      const result = GeneratedQuestionSchema.safeParse(invalidIndex);
      expect(result.success).toBe(false);
    });

    it("rejects time limit below 10 seconds", () => {
      const tooShort = {
        prompt: "Test?",
        options: ["A", "B", "C", "D"],
        correctOptionIndex: 0,
        timeLimitSeconds: 5,
      };

      const result = GeneratedQuestionSchema.safeParse(tooShort);
      expect(result.success).toBe(false);
    });

    it("rejects time limit above 120 seconds", () => {
      const tooLong = {
        prompt: "Test?",
        options: ["A", "B", "C", "D"],
        correctOptionIndex: 0,
        timeLimitSeconds: 180,
      };

      const result = GeneratedQuestionSchema.safeParse(tooLong);
      expect(result.success).toBe(false);
    });

    it("rejects empty options", () => {
      const emptyOption = {
        prompt: "Test?",
        options: ["A", "", "C", "D"],
        correctOptionIndex: 0,
        timeLimitSeconds: 30,
      };

      const result = GeneratedQuestionSchema.safeParse(emptyOption);
      expect(result.success).toBe(false);
    });

    it("rejects empty prompt", () => {
      const emptyPrompt = {
        prompt: "",
        options: ["A", "B", "C", "D"],
        correctOptionIndex: 0,
        timeLimitSeconds: 30,
      };

      const result = GeneratedQuestionSchema.safeParse(emptyPrompt);
      expect(result.success).toBe(false);
    });
  });
});
