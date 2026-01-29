/**
 * LLM Provider Types and Interfaces
 * Reference: specs/004-ai-quiz-generation/research.md
 */

// ============================================
// Provider Types
// ============================================

export type LLMProviderType = "openai" | "anthropic" | "azure-foundry";

// ============================================
// Message Types
// ============================================

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ============================================
// Completion Types
// ============================================

export interface LLMCompletionOptions {
  model?: string;
  messages: LLMMessage[];
  maxTokens: number;
  temperature?: number;
  responseFormat?: "json" | "text";
}

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface LLMCompletionResult {
  content: string;
  model: string;
  finishReason: "stop" | "length" | "error";
  usage: LLMUsage;
}

// ============================================
// Model Information
// ============================================

export interface LLMModelInfo {
  id: string;
  displayName: string;
  provider: LLMProviderType;
  createdAt?: Date;
}

// ============================================
// Provider Interface
// ============================================

export interface LLMProvider {
  readonly name: LLMProviderType;

  /**
   * Generate a completion from the LLM
   */
  complete(options: LLMCompletionOptions): Promise<LLMCompletionResult>;

  /**
   * List available models for this provider
   */
  listModels(): Promise<LLMModelInfo[]>;

  /**
   * Test the connection and return the primary model name
   */
  testConnection(): Promise<{ success: boolean; modelName?: string }>;
}

// ============================================
// Settings Types
// ============================================

export interface LLMSettingsData {
  id: string;
  hostId: string;
  provider: LLMProviderType;
  apiEndpoint: string;
  apiKey: string; // Decrypted for use
  detectedModel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LLMSettingsInput {
  provider: LLMProviderType;
  apiEndpoint: string;
  apiKey: string;
}

export interface LLMConnectionTestResult {
  success: boolean;
  modelName?: string;
  error?: string;
}

// ============================================
// Generation Types
// ============================================

export type GenerationSourceType = "topic" | "document" | "url";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type QuizLanguage = "en" | "fr";

export interface GenerationSource {
  type: GenerationSourceType;
  value: string; // Topic text, filename, or URL
  content?: string; // Extracted text content (for document/URL)
}

export interface GenerationOptions {
  source: GenerationSource;
  questionCount: number; // 1-20
  difficulty: DifficultyLevel;
}

export interface GeneratedQuestion {
  prompt: string;
  options: string[]; // Exactly 4
  correctOptionIndex: number; // 0-3
  timeLimitSeconds: number; // Default 30, editable 10-120
  explanation?: string; // From LLM for review
}

export interface GenerationResult {
  questions: GeneratedQuestion[];
  tokenUsage: LLMUsage;
  warnings?: string[];
}

// ============================================
// Quiz Generation Metadata
// ============================================

export interface QuizGenerationMetadata {
  sourceType: GenerationSourceType;
  sourceValue: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
  generatedAt: string; // ISO timestamp
}
