import { describe, it, expect } from "vitest";
import {
  CreateQuizRequestSchema,
  JoinSessionRequestSchema,
  SubmitAnswerRequestSchema,
  PinSchema,
  HostControlRequestSchema,
} from "@/lib/validation/schemas";

describe("Validation Schemas", () => {
  describe("CreateQuizRequestSchema", () => {
    it("validates a correct quiz request", () => {
      const validQuiz = {
        title: "Test Quiz",
        description: "A test quiz",
        questions: [
          {
            prompt: "What is 2+2?",
            timeLimitSeconds: 20,
            options: ["3", "4", "5", "6"],
            correctOptionIndex: 1,
          },
        ],
      };

      const result = CreateQuizRequestSchema.safeParse(validQuiz);
      expect(result.success).toBe(true);
    });

    it("requires title", () => {
      const invalid = {
        questions: [
          {
            prompt: "Test",
            timeLimitSeconds: 20,
            options: ["A", "B"],
            correctOptionIndex: 0,
          },
        ],
      };

      const result = CreateQuizRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("requires at least one question", () => {
      const invalid = {
        title: "Test Quiz",
        questions: [],
      };

      const result = CreateQuizRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("requires at least 2 options per question", () => {
      const invalid = {
        title: "Test Quiz",
        questions: [
          {
            prompt: "Test",
            timeLimitSeconds: 20,
            options: ["Only one option"],
            correctOptionIndex: 0,
          },
        ],
      };

      const result = CreateQuizRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("allows maximum 6 options per question", () => {
      const valid = {
        title: "Test Quiz",
        questions: [
          {
            prompt: "Test",
            timeLimitSeconds: 20,
            options: ["A", "B", "C", "D", "E", "F"],
            correctOptionIndex: 0,
          },
        ],
      };

      const result = CreateQuizRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);

      const invalid = {
        title: "Test Quiz",
        questions: [
          {
            prompt: "Test",
            timeLimitSeconds: 20,
            options: ["A", "B", "C", "D", "E", "F", "G"],
            correctOptionIndex: 0,
          },
        ],
      };

      const invalidResult = CreateQuizRequestSchema.safeParse(invalid);
      expect(invalidResult.success).toBe(false);
    });

    it("validates time limit bounds (5-120 seconds)", () => {
      const tooShort = {
        title: "Test Quiz",
        questions: [
          {
            prompt: "Test",
            timeLimitSeconds: 4,
            options: ["A", "B"],
            correctOptionIndex: 0,
          },
        ],
      };

      const tooLong = {
        title: "Test Quiz",
        questions: [
          {
            prompt: "Test",
            timeLimitSeconds: 121,
            options: ["A", "B"],
            correctOptionIndex: 0,
          },
        ],
      };

      expect(CreateQuizRequestSchema.safeParse(tooShort).success).toBe(false);
      expect(CreateQuizRequestSchema.safeParse(tooLong).success).toBe(false);
    });
  });

  describe("JoinSessionRequestSchema", () => {
    it("validates a correct join request", () => {
      const valid = { nickname: "Player1" };
      const result = JoinSessionRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("trims whitespace from nickname", () => {
      const valid = { nickname: "  Player1  " };
      const result = JoinSessionRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nickname).toBe("Player1");
      }
    });

    it("rejects empty nickname", () => {
      const invalid = { nickname: "" };
      const result = JoinSessionRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects nickname over 24 characters", () => {
      const invalid = { nickname: "A".repeat(25) };
      const result = JoinSessionRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("PinSchema", () => {
    it("validates correct 6-digit PINs", () => {
      expect(PinSchema.safeParse("123456").success).toBe(true);
      expect(PinSchema.safeParse("000000").success).toBe(true);
      expect(PinSchema.safeParse("999999").success).toBe(true);
    });

    it("rejects invalid PINs", () => {
      expect(PinSchema.safeParse("12345").success).toBe(false);
      expect(PinSchema.safeParse("1234567").success).toBe(false);
      expect(PinSchema.safeParse("12345a").success).toBe(false);
      expect(PinSchema.safeParse("").success).toBe(false);
    });
  });

  describe("SubmitAnswerRequestSchema", () => {
    it("validates a correct answer submission", () => {
      const valid = {
        participantId: "participant123",
        questionId: "question456",
        selectedOptionId: "option789",
      };

      const result = SubmitAnswerRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("requires all fields", () => {
      const missing = {
        participantId: "participant123",
        questionId: "question456",
        // missing selectedOptionId
      };

      const result = SubmitAnswerRequestSchema.safeParse(missing);
      expect(result.success).toBe(false);
    });
  });

  describe("HostControlRequestSchema", () => {
    it("validates valid actions", () => {
      const actions = [
        "start_game",
        "next_question",
        "reveal_answer",
        "show_leaderboard",
        "end_game",
      ];

      for (const action of actions) {
        const result = HostControlRequestSchema.safeParse({ action });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid actions", () => {
      const invalid = { action: "invalid_action" };
      const result = HostControlRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
