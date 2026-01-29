/**
 * POST /api/llm/test-connection
 * Test LLM connection without saving settings
 */

import { NextRequest, NextResponse } from "next/server";
import {
  jsonResponse,
  parseJsonBody,
} from "@/lib/api/http";
import { TestConnectionRequestSchema } from "@/lib/validation/llmSchemas";
import { requireAuth } from "@/lib/auth/middleware";
import { createProvider } from "@/lib/llm/client";
import type { LLMProviderType } from "@/lib/llm/types";
import { LLMError } from "@/lib/llm/errors";

interface TestConnectionResponse {
  success: boolean;
  modelName?: string;
  error?: string;
}

/**
 * POST /api/llm/test-connection
 * Test LLM connection with provided credentials
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(request, TestConnectionRequestSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { provider, apiEndpoint, apiKey, model } = parsed.data;

  try {
    const llmProvider = createProvider(
      provider as LLMProviderType,
      apiEndpoint,
      apiKey || "", // API key is optional for local proxies
      model
    );

    const result = await llmProvider.testConnection();

    const response: TestConnectionResponse = {
      success: result.success,
      modelName: result.modelName,
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("LLM connection test failed:", error);

    let errorMessage = "Failed to connect to LLM provider";
    
    if (error instanceof LLMError) {
      errorMessage = error.toUserMessage();
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const response: TestConnectionResponse = {
      success: false,
      error: errorMessage,
    };

    return jsonResponse(response);
  }
}
