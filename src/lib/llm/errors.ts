/**
 * LLM Error Handling
 * Reference: specs/004-ai-quiz-generation/research.md
 */

export type LLMErrorCode =
  | "authentication"
  | "rate_limited"
  | "invalid_request"
  | "server_error"
  | "overloaded"
  | "timeout"
  | "network"
  | "parse_error"
  | "unknown";

export interface LLMErrorDetails {
  code: LLMErrorCode;
  message: string;
  retryable: boolean;
  statusCode?: number;
  provider?: string;
}

/**
 * Normalized error class for all LLM operations
 */
export class LLMError extends Error {
  readonly code: LLMErrorCode;
  readonly retryable: boolean;
  readonly statusCode?: number;
  readonly provider?: string;

  constructor(details: LLMErrorDetails) {
    super(details.message);
    this.name = "LLMError";
    this.code = details.code;
    this.retryable = details.retryable;
    this.statusCode = details.statusCode;
    this.provider = details.provider;
  }

  /**
   * Create user-friendly error message
   */
  toUserMessage(): string {
    switch (this.code) {
      case "authentication":
        return "Invalid API key. Please check your LLM settings.";
      case "rate_limited":
        return "Too many requests. Please wait a moment and try again.";
      case "invalid_request":
        return "The request was invalid. Please check your input.";
      case "server_error":
        return "The LLM service is experiencing issues. Please try again later.";
      case "overloaded":
        return "The LLM service is currently overloaded. Please try again later.";
      case "timeout":
        return "The request timed out. Please try again.";
      case "network":
        return "Network error. Please check your connection.";
      case "parse_error":
        return "Failed to parse LLM response. Please try again.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }
}

/**
 * Map HTTP status codes to LLM error codes
 */
export function mapStatusToErrorCode(
  status: number,
  _provider: string
): { code: LLMErrorCode; retryable: boolean } {
  switch (status) {
    case 400:
      return { code: "invalid_request", retryable: false };
    case 401:
    case 403:
      return { code: "authentication", retryable: false };
    case 429:
      return { code: "rate_limited", retryable: true };
    case 500:
    case 502:
    case 503:
      return { code: "server_error", retryable: true };
    case 529: // Anthropic overloaded
      return { code: "overloaded", retryable: true };
    default:
      if (status >= 500) {
        return { code: "server_error", retryable: true };
      }
      return { code: "unknown", retryable: false };
  }
}

/**
 * Create LLMError from HTTP response
 */
export async function createErrorFromResponse(
  response: Response,
  provider: string
): Promise<LLMError> {
  const { code, retryable } = mapStatusToErrorCode(response.status, provider);

  let message = `${provider} API error: ${response.status} ${response.statusText}`;

  try {
    const body = await response.json();
    if (body.error?.message) {
      message = body.error.message;
    } else if (body.message) {
      message = body.message;
    }
  } catch {
    // Use default message if body can't be parsed
  }

  return new LLMError({
    code,
    message,
    retryable,
    statusCode: response.status,
    provider,
  });
}

/**
 * Create LLMError from network/timeout error
 */
export function createNetworkError(
  error: Error,
  provider: string
): LLMError {
  if (error.name === "AbortError") {
    return new LLMError({
      code: "timeout",
      message: "Request timed out",
      retryable: true,
      provider,
    });
  }

  return new LLMError({
    code: "network",
    message: error.message || "Network error",
    retryable: true,
    provider,
  });
}
