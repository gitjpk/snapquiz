/**
 * OpenAI Provider Implementation
 * Reference: specs/004-ai-quiz-generation/research.md
 */

import type {
  LLMProvider,
  LLMCompletionOptions,
  LLMCompletionResult,
  LLMModelInfo,
} from "../types";
import { createErrorFromResponse, createNetworkError, LLMError } from "../errors";

const DEFAULT_TIMEOUT = 60000; // 60 seconds
const DEFAULT_MODEL = "gpt-4o-mini";

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens: number;
  temperature?: number;
  response_format?: { type: "json_object" | "text" };
}

interface OpenAICompletionResponse {
  id: string;
  choices: Array<{
    message: { content: string };
    finish_reason: "stop" | "length";
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIModelsResponse {
  data: Array<{
    id: string;
    owned_by: string;
    created: number;
  }>;
}

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai" as const;
  private readonly endpoint: string;
  private readonly apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    // Normalize endpoint - remove trailing slash
    this.endpoint = endpoint.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  async complete(options: LLMCompletionOptions): Promise<LLMCompletionResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      const requestBody: OpenAICompletionRequest = {
        model: options.model || DEFAULT_MODEL,
        messages: options.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: options.maxTokens,
        temperature: options.temperature ?? 0.7,
      };

      if (options.responseFormat === "json") {
        requestBody.response_format = { type: "json_object" };
      }

      // Build headers - only include Authorization if API key is provided
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await createErrorFromResponse(response, this.name);
      }

      const data = (await response.json()) as OpenAICompletionResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new LLMError({
          code: "parse_error",
          message: "No completion choices returned",
          retryable: false,
          provider: this.name,
        });
      }

      const choice = data.choices[0];

      return {
        content: choice.message.content,
        model: data.model,
        finishReason: choice.finish_reason === "length" ? "length" : "stop",
        usage: {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      };
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw createNetworkError(error as Error, this.name);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async listModels(): Promise<LLMModelInfo[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Build headers - only include Authorization if API key is provided
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.endpoint}/v1/models`, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await createErrorFromResponse(response, this.name);
      }

      const data = (await response.json()) as OpenAIModelsResponse;

      return data.data.map((model) => ({
        id: model.id,
        displayName: model.id,
        provider: this.name,
        createdAt: new Date(model.created * 1000),
      }));
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw createNetworkError(error as Error, this.name);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async testConnection(): Promise<{ success: boolean; modelName?: string }> {
    try {
      const models = await this.listModels();

      // Find a preferred model or use the first one
      const preferredModels = ["gpt-4o-mini", "gpt-4o", "gpt-4", "gpt-3.5-turbo"];
      const model =
        models.find((m) => preferredModels.some((p) => m.id.includes(p))) ||
        models[0];

      return {
        success: true,
        modelName: model?.id,
      };
    } catch {
      return { success: false };
    }
  }
}
