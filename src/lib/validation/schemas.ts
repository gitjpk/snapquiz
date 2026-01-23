import { z } from "zod";

// ============================================
// Common validation utilities
// ============================================

/** Sanitize string to remove potential XSS */
export const sanitizeString = (str: string) => {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\\/g, "&#x5C;") // backslash
    .replace(/`/g, "&#x60;"); // backtick (template literal injection)
};

/** Remove invisible/control characters except newlines and tabs */
const removeControlChars = (str: string): string => {
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
};

/** Safe string that trims, removes control chars, and has reasonable max length */
const safeString = (maxLength: number) =>
  z
    .string()
    .transform(removeControlChars)
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .min(1, "This field is required")
        .max(maxLength, `Must be ${maxLength} characters or less`)
    );

/** Safe string that allows empty values */
const safeStringOptional = (maxLength: number) =>
  z
    .string()
    .transform(removeControlChars)
    .transform((s) => s.trim())
    .pipe(z.string().max(maxLength, `Must be ${maxLength} characters or less`))
    .optional()
    .nullable();

// ============================================
// Security patterns
// ============================================

/** Pattern to detect potential script injection attempts */
const UNSAFE_PATTERN = /javascript:|data:|vbscript:|on\w+=/i;

/** URL validator that blocks dangerous protocols */
const safeUrl = z
  .string()
  .url("Must be a valid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "Only HTTP and HTTPS URLs are allowed" }
  )
  .refine(
    (url) => !UNSAFE_PATTERN.test(url),
    { message: "URL contains unsafe content" }
  );

// ============================================
// Quiz schemas
// ============================================

export const MediaSchema = z
  .object({
    type: z.enum(["image", "video"]),
    url: safeUrl,
  })
  .nullable()
  .optional();

export const CreateQuestionSchema = z.object({
  prompt: safeString(500),
  timeLimitSeconds: z.number().int().min(5).max(120),
  media: MediaSchema,
  options: z
    .array(z.string())
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options allowed"),
  correctOptionIndex: z.number().int().min(0),
}).transform((data) => {
  // Filter empty options and track index mapping
  const filteredOptions: string[] = [];
  let newCorrectIndex = 0;
  
  data.options.forEach((opt, i) => {
    const trimmed = opt.trim();
    if (trimmed.length > 0) {
      if (i === data.correctOptionIndex) {
        newCorrectIndex = filteredOptions.length;
      }
      filteredOptions.push(trimmed);
    }
  });
  
  return {
    ...data,
    options: filteredOptions,
    correctOptionIndex: newCorrectIndex,
  };
}).pipe(
  z.object({
    prompt: z.string(),
    timeLimitSeconds: z.number(),
    media: MediaSchema,
    options: z
      .array(z.string().max(200, "Option must be 200 characters or less"))
      .min(2, "At least 2 non-empty options required")
      .max(6, "Maximum 6 options allowed"),
    correctOptionIndex: z.number(),
  }).refine(
    (data) => data.correctOptionIndex < data.options.length,
    { message: "Correct option index must be within range of available options", path: ["correctOptionIndex"] }
  )
);

export const CreateQuizRequestSchema = z.object({
  title: safeString(120),
  description: z.string().max(500).optional().transform(s => s?.trim() || null),
  questions: z
    .array(CreateQuestionSchema)
    .min(1, "At least 1 question required"),
});

export const UpdateQuizRequestSchema = z.object({
  title: safeString(120).optional(),
  description: safeStringOptional(500),
  questions: z.array(CreateQuestionSchema).optional(),
});

// ============================================
// Session schemas
// ============================================

export const CreateSessionRequestSchema = z.object({
  quizId: z.string().min(1, "Quiz ID is required"),
  leaderboardTopN: z.number().int().min(1).max(20).default(5),
});

export const PinSchema = z
  .string()
  .regex(/^\d{6}$/, "PIN must be exactly 6 digits");

export const JoinSessionRequestSchema = z.object({
  nickname: safeString(24),
});

export const SubmitAnswerRequestSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  questionId: z.string().min(1, "Question ID is required"),
  selectedOptionId: z.string().min(1, "Selected option ID is required"),
});

export const HostControlActionSchema = z.enum([
  "start_game",
  "next_question",
  "reveal_answer",
  "show_leaderboard",
  "end_game",
]);

export const HostControlRequestSchema = z.object({
  action: HostControlActionSchema,
});

// ============================================
// Response types (for type inference)
// ============================================

export type CreateQuizRequest = z.infer<typeof CreateQuizRequestSchema>;
export type UpdateQuizRequest = z.infer<typeof UpdateQuizRequestSchema>;
export type CreateQuestionRequest = z.infer<typeof CreateQuestionSchema>;
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;
export type JoinSessionRequest = z.infer<typeof JoinSessionRequestSchema>;
export type SubmitAnswerRequest = z.infer<typeof SubmitAnswerRequestSchema>;
export type HostControlAction = z.infer<typeof HostControlActionSchema>;
export type HostControlRequest = z.infer<typeof HostControlRequestSchema>;
