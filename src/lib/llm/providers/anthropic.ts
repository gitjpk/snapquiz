/**
 * Anthropic Provider Implementation
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
const DEFAULT_MODEL = "claude-3-5-sonnet-20241022";
const API_VERSION = "2023-06-01";

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicCompletionRequest {
  model: string;
  max_tokens: number;
  system?: string;
  messages: AnthropicMessage[];
  temperature?: number;
}

interface AnthropicCompletionResponse {
  id: string;
  content: Array<{
    type: "text";
    text: string;
  }>;
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence";
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicModelsResponse {
  data: Array<{
    id: string;
    display_name: string;
    created_at: string;
  }>;
}

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic" as const;
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
      // Extract system message if present
      const systemMessage = options.messages.find((m) => m.role === "system");
      const nonSystemMessages = options.messages.filter(
        (m) => m.role !== "system"
      );

      // Anthropic requires alternating user/assistant messages starting with user
      const messages: AnthropicMessage[] = nonSystemMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

      const requestBody: AnthropicCompletionRequest = {
        model: options.model || DEFAULT_MODEL,
        max_tokens: options.maxTokens,
        messages,
        temperature: options.temperature ?? 0.7,
      };

      if (systemMessage) {
        requestBody.system = systemMessage.content;
      }

      // Build headers - only include x-api-key if API key is provided
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "anthropic-version": API_VERSION,
      };
      if (this.apiKey) {
        headers["x-api-key"] = this.apiKey;
      }

      const response = await fetch(`${this.endpoint}/v1/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await createErrorFromResponse(response, this.name);
      }

      const data = (await response.json()) as AnthropicCompletionResponse;

      if (!data.content || data.content.length === 0) {
        throw new LLMError({
          code: "parse_error",
          message: "No content returned",
          retryable: false,
          provider: this.name,
        });
      }

      const textContent = data.content.find((c) => c.type === "text");
      if (!textContent) {
        throw new LLMError({
          code: "parse_error",
          message: "No text content returned",
          retryable: false,
          provider: this.name,
        });
      }

      return {
        content: textContent.text,
        model: data.model,
        finishReason: data.stop_reason === "max_tokens" ? "length" : "stop",
        usage: {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
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
      // Build headers - only include x-api-key if API key is provided
      const headers: Record<string, string> = {
        "anthropic-version": API_VERSION,
      };
      if (this.apiKey) {
        headers["x-api-key"] = this.apiKey;
      }

      const response = await fetch(`${this.endpoint}/v1/models`, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await createErrorFromResponse(response, this.name);
      }

      const data = (await response.json()) as AnthropicModelsResponse;

      return data.data.map((model) => ({
        id: model.id,
        displayName: model.display_name || model.id,
        provider: this.name,
        createdAt: model.created_at ? new Date(model.created_at) : undefined,
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
      const preferredModels = [
        "claude-3-5-sonnet",
        "claude-3-opus",
        "claude-3-haiku",
        "claude-2",
      ];
      const model =
        models.find((m) =>
          preferredModels.some((p) => m.id.includes(p))
        ) || models[0];

      return {
        success: true,
        modelName: model?.id,
      };
    } catch {
      return { success: false };
    }
  }
}
