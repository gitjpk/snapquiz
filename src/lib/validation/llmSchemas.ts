import { z } from "zod";

// ============================================
// LLM Configuration Schemas
// ============================================

/** Supported LLM provider types */
export const LLMProviderSchema = z.enum(["openai", "anthropic", "azure-foundry"]);

/** API endpoint validation - HTTPS required except for localhost */
const llmApiEndpoint = z
  .string()
  .min(1, "API endpoint is required")
  .max(500, "API endpoint must be 500 characters or less")
  .url("Must be a valid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        // Allow HTTP for localhost/127.0.0.1, require HTTPS otherwise
        const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
        return parsed.protocol === "https:" || (parsed.protocol === "http:" && isLocalhost);
      } catch {
        return false;
      }
    },
    { message: "API endpoint must use HTTPS (or HTTP for localhost)" }
  );

/** API key validation - optional for local proxies */
const llmApiKey = z
  .string()
  .max(500, "API key must be 500 characters or less")
  .optional()
  .or(z.literal(""));

/** Available models for Azure AI Foundry */
export const AzureFoundryModelSchema = z.enum(["Mistral-Large-3", "DeepSeek-V3.2", "gpt-5.2-chat"]);

/** Schema for saving LLM settings */
export const LLMSettingsInputSchema = z.object({
  provider: LLMProviderSchema,
  apiEndpoint: llmApiEndpoint,
  apiKey: llmApiKey,
  model: z.string().optional(), // Model selection for azure-foundry
});

/** Schema for LLM settings response (no API key) */
export const LLMSettingsResponseSchema = z.object({
  id: z.string(),
  hostId: z.string(),
  provider: LLMProviderSchema,
  apiEndpoint: z.string(),
  detectedModel: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================
// Quiz Generation Schemas
// ============================================

/** Difficulty levels for generated questions */
export const DifficultyLevelSchema = z.enum(["easy", "medium", "hard"]);

/** Quiz language options */
export const QuizLanguageSchema = z.enum(["en", "fr"]);
export type QuizLanguage = z.infer<typeof QuizLanguageSchema>;

/** Source type for quiz generation */
export const GenerationSourceTypeSchema = z.enum(["topic", "document", "url"]);

/** Topic-based generation source */
const topicSourceSchema = z.object({
  type: z.literal("topic"),
  value: z
    .string()
    .min(1, "Topic is required")
    .max(1000, "Topic must be 1000 characters or less"),
});

/** URL-based generation source */
const urlSourceSchema = z.object({
  type: z.literal("url"),
  value: z
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
    ),
});

/** Document-based generation source (value is filename) */
const documentSourceSchema = z.object({
  type: z.literal("document"),
  value: z.string().min(1, "Document filename is required"),
  content: z.string().optional(),
});

/** Combined generation source schema */
export const GenerationSourceSchema = z.discriminatedUnion("type", [
  topicSourceSchema,
  urlSourceSchema,
  documentSourceSchema,
]);

/** Schema for quiz generation request */
export const GenerateQuizRequestSchema = z.object({
  source: GenerationSourceSchema,
  questionCount: z
    .number()
    .int("Question count must be an integer")
    .min(1, "At least 1 question required")
    .max(20, "Maximum 20 questions allowed"),
  difficulty: DifficultyLevelSchema,
  language: QuizLanguageSchema.default("en"),
});

/** Schema for generated question from LLM */
export const GeneratedQuestionSchema = z.object({
  prompt: z
    .string()
    .min(1, "Question prompt is required")
    .max(500, "Question must be 500 characters or less"),
  options: z
    .array(
      z
        .string()
        .min(1, "Option cannot be empty")
        .max(200, "Option must be 200 characters or less")
    )
    .length(4, "Exactly 4 options required"),
  correctOptionIndex: z
    .number()
    .int()
    .min(0)
    .max(3, "Correct option index must be 0-3"),
  timeLimitSeconds: z
    .number()
    .int()
    .min(10, "Minimum time limit is 10 seconds")
    .max(120, "Maximum time limit is 120 seconds")
    .default(30),
  explanation: z.string().optional(),
});

/** Token usage information */
export const TokenUsageSchema = z.object({
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
});

/** Schema for generation result */
export const GenerationResultSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).min(1),
  tokenUsage: TokenUsageSchema,
  warnings: z.array(z.string()).optional(),
});

/** Schema for quiz generation metadata (stored in Quiz.generatedFrom) */
export const QuizGenerationMetadataSchema = z.object({
  sourceType: GenerationSourceTypeSchema,
  sourceValue: z.string(),
  difficulty: DifficultyLevelSchema,
  questionCount: z.number().int().min(1),
  tokenUsage: z.object({
    inputTokens: z.number().int().min(0),
    outputTokens: z.number().int().min(0),
  }),
  generatedAt: z.string().datetime(),
});

/** Schema for connection test request */
export const TestConnectionRequestSchema = z.object({
  provider: LLMProviderSchema,
  apiEndpoint: llmApiEndpoint,
  apiKey: llmApiKey,
  model: z.string().optional(), // Model selection for azure-foundry
});

/** Schema for connection test response */
export const TestConnectionResponseSchema = z.object({
  success: z.boolean(),
  modelName: z.string().optional(),
  error: z.string().optional(),
});

// ============================================
// Type exports
// ============================================

export type LLMProvider = z.infer<typeof LLMProviderSchema>;
export type LLMSettingsInput = z.infer<typeof LLMSettingsInputSchema>;
export type LLMSettingsResponse = z.infer<typeof LLMSettingsResponseSchema>;
export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>;
export type GenerationSourceType = z.infer<typeof GenerationSourceTypeSchema>;
export type GenerationSource = z.infer<typeof GenerationSourceSchema>;
export type GenerateQuizRequest = z.infer<typeof GenerateQuizRequestSchema>;
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type TokenUsage = z.infer<typeof TokenUsageSchema>;
export type GenerationResult = z.infer<typeof GenerationResultSchema>;
export type QuizGenerationMetadata = z.infer<typeof QuizGenerationMetadataSchema>;
export type TestConnectionRequest = z.infer<typeof TestConnectionRequestSchema>;
export type TestConnectionResponse = z.infer<typeof TestConnectionResponseSchema>;
