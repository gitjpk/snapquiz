/**
 * POST /api/quizzes/generate
 * Generate quiz questions using AI
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import {
  jsonResponse,
  badRequest,
  parseJsonBody,
  internalError,
} from "@/lib/api/http";
import { createRateLimiter, getClientIp, withRateLimit } from "@/lib/api/rateLimit";
import { GenerateQuizRequestSchema } from "@/lib/validation/llmSchemas";
import { requireAuth } from "@/lib/auth/middleware";
import { createProviderFromSettings } from "@/lib/llm/client";
import { buildTopicPrompt, parseGenerationResponse } from "@/lib/llm/prompts";
import { LLMError } from "@/lib/llm/errors";
import type { GeneratedQuestion, LLMProviderType } from "@/lib/llm/types";

// Use a constant host ID for MVP (single host)
const HOST_ID = "default-host";

// Rate limit: 10 generations per minute per host (protects against API abuse)
const generateRateLimit = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
  keyPrefix: "quiz-gen",
});

interface GenerateResponse {
  questions: GeneratedQuestion[];
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  warnings?: string[];
}

/**
 * POST /api/quizzes/generate
 * Generate quiz questions from a topic (US1 MVP)
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // Rate limit to prevent API abuse (10 requests/minute)
  const clientIp = getClientIp(request);
  const rateLimitResult = withRateLimit(request, clientIp, generateRateLimit);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  const parsed = await parseJsonBody(request, GenerateQuizRequestSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { source, questionCount, difficulty, language } = parsed.data;

  // Get LLM settings
  const settings = await prisma.lLMSettings.findUnique({
    where: { hostId: HOST_ID },
  });

  if (!settings) {
    return badRequest("LLM not configured. Please configure your AI provider in settings.");
  }

  try {
    // Create provider
    const provider = createProviderFromSettings({
      provider: settings.provider as LLMProviderType,
      apiEndpoint: settings.apiEndpoint,
      apiKey: settings.apiKey,
      model: settings.model || undefined,
    });

    // Build prompt based on source type
    let messages;
    if (source.type === "topic") {
      messages = buildTopicPrompt(source.value, questionCount, difficulty, language);
    } else {
      // Document and URL support will be added in US2 and US3
      return badRequest(`Source type '${source.type}' is not yet supported`);
    }

    // Call LLM
    const result = await provider.complete({
      messages,
      maxTokens: 4000,
      temperature: 0.7,
      responseFormat: "json",
    });

    // Parse response
    const parsedResponse = parseGenerationResponse(result.content);

    // Convert to GeneratedQuestion format
    const questions: GeneratedQuestion[] = parsedResponse.questions.map((q) => ({
      prompt: q.question,
      options: q.options,
      correctOptionIndex: q.correctAnswer,
      timeLimitSeconds: 30,
      explanation: q.explanation,
    }));

    // Check if we got fewer questions than requested
    const warnings: string[] = [];
    if (questions.length < questionCount) {
      warnings.push(
        `Generated ${questions.length} questions instead of ${questionCount} requested`
      );
    }

    const response: GenerateResponse = {
      questions,
      tokenUsage: result.usage,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Quiz generation error:", error);

    if (error instanceof LLMError) {
      return jsonResponse(
        {
          code: "LLM_ERROR",
          message: error.toUserMessage(),
        },
        error.retryable ? 503 : 400
      );
    }

    if (error instanceof SyntaxError || error instanceof Error) {
      return badRequest(`Failed to parse LLM response: ${error.message}`);
    }

    return internalError("Failed to generate quiz");
  }
}
