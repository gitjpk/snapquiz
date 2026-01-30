/**
 * Azure AI Foundry Provider Implementation
 * For models deployed in Azure AI Foundry (services.ai.azure.com)
 * Uses OpenAI-compatible endpoint format: /openai/v1/chat/completions
 */

import type {
  LLMProvider,
  LLMCompletionOptions,
  LLMCompletionResult,
  LLMModelInfo,
} from "../types";
import { createErrorFromResponse, createNetworkError, LLMError } from "../errors";

const DEFAULT_TIMEOUT = 60000; // 60 seconds

interface AzureMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AzureCompletionRequest {
  model: string;
  messages: AzureMessage[];
  max_tokens?: number;
  max_completion_tokens?: number;
  temperature?: number;
  response_format?: { type: "json_object" | "text" };
}

interface AzureCompletionResponse {
  id: string;
  choices: Array<{
    message: { 
      content: string | null;
      reasoning_content?: string; // For thinking models like Kimi-K2-Thinking
    };
    finish_reason: "stop" | "length";
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AzureFoundryProvider implements LLMProvider {
  readonly name = "azure-foundry" as const;
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(endpoint: string, apiKey: string, model: string = "Mistral-Large-3") {
    // Normalize endpoint - remove trailing slash and ensure /openai/v1 path
    let normalizedEndpoint = endpoint.replace(/\/+$/, "");
    
    // If endpoint doesn't contain /openai/v1, append it
    if (!normalizedEndpoint.includes("/openai/v1")) {
      normalizedEndpoint = `${normalizedEndpoint}/openai/v1`;
    }
    
    this.endpoint = normalizedEndpoint;
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(options: LLMCompletionOptions): Promise<LLMCompletionResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      // GPT-5.x, o1, o3 models use max_completion_tokens instead of max_tokens
      // and don't support temperature (only default value 1)
      const isReasoningModel = this.model.toLowerCase().includes('gpt-5') || 
                                  this.model.toLowerCase().startsWith('o1') ||
                                  this.model.toLowerCase().startsWith('o3');
      
      const requestBody: AzureCompletionRequest = {
        model: this.model,
        messages: options.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        ...(isReasoningModel 
          ? { max_completion_tokens: options.maxTokens }
          : { max_tokens: options.maxTokens }),
        // Reasoning models (GPT-5.x, o1, o3) don't support temperature parameter
        ...(isReasoningModel ? {} : { temperature: options.temperature ?? 0.7 }),
      };

      if (options.responseFormat === "json") {
        requestBody.response_format = { type: "json_object" };
      }

      // Azure AI Foundry OpenAI-compatible endpoint uses api-key header
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "api-key": this.apiKey,
      };

      // OpenAI-compatible endpoint: /openai/v1/chat/completions
      const url = `${this.endpoint}/chat/completions`;

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await createErrorFromResponse(response, this.name);
      }

      const data = (await response.json()) as AzureCompletionResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new LLMError({
          code: "parse_error",
          message: "No completion choices returned",
          retryable: false,
          provider: this.name,
        });
      }

      const choice = data.choices[0];
      
      // Handle thinking models that may return content in reasoning_content
      // or have null content
      let content = choice.message.content;
      if (content === null && choice.message.reasoning_content) {
        content = choice.message.reasoning_content;
      }
      
      if (content === null || content === undefined) {
        throw new LLMError({
          code: "parse_error",
          message: "Model returned null content. Full response: " + JSON.stringify(data.choices[0]),
          retryable: true,
          provider: this.name,
        });
      }

      return {
        content: content,
        model: data.model || this.model,
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
    // Return the configured model
    return [
      {
        id: this.model,
        displayName: this.model,
        provider: this.name,
        createdAt: new Date(),
      },
    ];
  }

  async testConnection(): Promise<{ success: boolean; modelName?: string }> {
    try {
      // Try a minimal completion to test the connection
      const result = await this.complete({
        messages: [{ role: "user", content: "Hi" }],
        maxTokens: 5,
      });
      
      return { success: true, modelName: result.model };
    } catch {
      return { success: false };
    }
  }
}
