/**
 * GET/PUT /api/llm/settings
 * Manage LLM settings for authenticated host
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import {
  jsonResponse,
  notFound,
  internalError,
  parseJsonBody,
} from "@/lib/api/http";
import { LLMSettingsInputSchema } from "@/lib/validation/llmSchemas";
import { requireAuth } from "@/lib/auth/middleware";
import { encryptApiKey, createProvider } from "@/lib/llm/client";
import type { LLMProviderType } from "@/lib/llm/types";

// Use a constant host ID for MVP (single host)
const HOST_ID = "default-host";

interface LLMSettingsResponse {
  id: string;
  hostId: string;
  provider: string;
  apiEndpoint: string;
  model: string | null;
  detectedModel: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/llm/settings
 * Get current LLM settings (without API key)
 */
export async function GET(): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = await prisma.lLMSettings.findUnique({
      where: { hostId: HOST_ID },
    });

    if (!settings) {
      return notFound("LLM settings");
    }

    const response: LLMSettingsResponse = {
      id: settings.id,
      hostId: settings.hostId,
      provider: settings.provider,
      apiEndpoint: settings.apiEndpoint,
      model: settings.model,
      detectedModel: settings.detectedModel,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Error fetching LLM settings:", error);
    return internalError("Failed to fetch LLM settings");
  }
}

/**
 * PUT /api/llm/settings
 * Create or update LLM settings
 */
export async function PUT(request: NextRequest): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(request, LLMSettingsInputSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { provider, apiEndpoint, apiKey, model } = parsed.data;

  try {
    // Test the connection before saving
    const llmProvider = createProvider(
      provider as LLMProviderType,
      apiEndpoint,
      apiKey || "", // API key is optional for local proxies
      model
    );
    const testResult = await llmProvider.testConnection();

    // Encrypt the API key only if provided
    const encryptedKey = apiKey ? encryptApiKey(apiKey) : "";

    // Upsert the settings
    const settings = await prisma.lLMSettings.upsert({
      where: { hostId: HOST_ID },
      create: {
        hostId: HOST_ID,
        provider,
        apiEndpoint,
        apiKey: encryptedKey,
        model: model || null,
        detectedModel: testResult.modelName || null,
      },
      update: {
        provider,
        apiEndpoint,
        apiKey: encryptedKey,
        model: model || null,
        detectedModel: testResult.modelName || null,
      },
    });

    const response: LLMSettingsResponse = {
      id: settings.id,
      hostId: settings.hostId,
      provider: settings.provider,
      apiEndpoint: settings.apiEndpoint,
      model: settings.model,
      detectedModel: settings.detectedModel,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Error saving LLM settings:", error);
    
    // Check if it's an LLM error (connection test failed)
    if (error && typeof error === "object" && "code" in error) {
      const llmError = error as { code: string; message: string };
      return jsonResponse(
        {
          code: "LLM_CONNECTION_FAILED",
          message: llmError.message || "Failed to connect to LLM provider",
        },
        400
      );
    }
    
    return internalError("Failed to save LLM settings");
  }
}
