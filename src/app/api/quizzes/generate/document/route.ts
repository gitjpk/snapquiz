/**
 * POST /api/quizzes/generate/document
 * Generate quiz questions from an uploaded document
 * Reference: specs/004-ai-quiz-generation/spec.md (US2)
 * Reference: specs/005-multi-host-accounts/spec.md - US3 LLM settings per host
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import {
  jsonResponse,
  badRequest,
  internalError,
} from "@/lib/api/http";
import { DifficultyLevelSchema, QuizLanguageSchema } from "@/lib/validation/llmSchemas";
import { requireAuth } from "@/lib/auth/middleware";
import { createProviderFromSettings } from "@/lib/llm/client";
import { buildDocumentPrompt, parseGenerationResponse } from "@/lib/llm/prompts";
import { LLMError } from "@/lib/llm/errors";
import { parseDocument, truncateContent } from "@/lib/parsing/document";
import type { GeneratedQuestion, LLMProviderType, QuizLanguage } from "@/lib/llm/types";

// Route segment config - allow larger uploads (50MB)
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
 * POST /api/quizzes/generate/document
 * Generate quiz questions from an uploaded document
 * Uses the authenticated host's LLM settings (FR-008)
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const questionCountStr = formData.get("questionCount") as string | null;
    const difficultyStr = formData.get("difficulty") as string | null;
    const languageStr = formData.get("language") as string | null;

    // Validate inputs
    if (!file) {
      return badRequest("No file uploaded");
    }

    if (file.size > MAX_FILE_SIZE) {
      return badRequest("File size exceeds 10MB limit");
    }

    const questionCount = parseInt(questionCountStr || "5", 10);
    if (isNaN(questionCount) || questionCount < 1 || questionCount > 20) {
      return badRequest("Question count must be between 1 and 20");
    }

    const difficultyResult = DifficultyLevelSchema.safeParse(difficultyStr || "medium");
    if (!difficultyResult.success) {
      return badRequest("Invalid difficulty level");
    }
    const difficulty = difficultyResult.data;

    const languageResult = QuizLanguageSchema.safeParse(languageStr || "en");
    const language: QuizLanguage = languageResult.success ? languageResult.data : "en";

    // Get LLM settings for the authenticated host (FR-008)
    const settings = await prisma.lLMSettings.findUnique({
      where: { hostId: auth.hostId },
    });

    if (!settings) {
      return badRequest("LLM not configured. Please configure your AI provider in settings.");
    }

    // Read file content
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse document
    const parseResult = await parseDocument(buffer, file.name);
    
    if ("code" in parseResult) {
      // Parse error
      return badRequest(parseResult.message);
    }

    // Truncate content for LLM
    const content = truncateContent(parseResult.content);

    // Create provider
    const provider = createProviderFromSettings({
      provider: settings.provider as LLMProviderType,
      apiEndpoint: settings.apiEndpoint,
      apiKey: settings.apiKey,
    });

    // Build prompt
    const messages = buildDocumentPrompt(
      content,
      file.name,
      questionCount,
      difficulty,
      language
    );

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

    // Collect warnings
    const warnings: string[] = [];
    if (questions.length < questionCount) {
      warnings.push(
        `Generated ${questions.length} questions instead of ${questionCount} requested`
      );
    }
    if (parseResult.content.length > 50000) {
      warnings.push(
        `Document was truncated (${parseResult.wordCount} words) - some content may not be covered`
      );
    }

    const response: GenerateResponse = {
      questions,
      tokenUsage: result.usage,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Document generation error:", error);

    if (error instanceof LLMError) {
      return jsonResponse(
        {
          code: "LLM_ERROR",
          message: error.toUserMessage(),
        },
        error.retryable ? 503 : 400
      );
    }

    if (error instanceof SyntaxError) {
      return badRequest("Failed to parse LLM response. Please try again.");
    }

    return internalError("Failed to generate quiz from document");
  }
}
