/**
 * URL Generation Endpoint - Generate Quiz from URL Content
 * Reference: specs/004-ai-quiz-generation/spec.md (US3)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { extractUrlContent, truncateUrlContent } from "@/lib/parsing";
import { createProvider, decryptApiKey, DEFAULT_ENDPOINTS } from "@/lib/llm/client";
import { buildUrlPrompt, parseGenerationResponse } from "@/lib/llm/prompts";
import { GenerateQuizRequestSchema } from "@/lib/validation/llmSchemas";
import type { DifficultyLevel } from "@/lib/validation/llmSchemas";
import type { LLMProviderType } from "@/lib/llm/types";

export async function POST(request: NextRequest) {
  try {
    // Get hostId from headers (set by auth middleware)
    const hostId = request.headers.get("x-host-id") || "default-host";

    // Parse and validate request
    const body = await request.json();
    const validation = GenerateQuizRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { source, questionCount, difficulty, language } = validation.data;

    if (source.type !== "url") {
      return NextResponse.json(
        { error: "Expected URL source type" },
        { status: 400 }
      );
    }

    // Get LLM settings
    const settings = await prisma.lLMSettings.findUnique({
      where: { hostId },
    });

    if (!settings) {
      return NextResponse.json(
        { error: "LLM not configured. Please set up your provider in settings." },
        { status: 400 }
      );
    }

    // Extract URL content (source.value contains the URL)
    const urlValue = source.value;
    const extractionResult = await extractUrlContent(urlValue);

    if ("code" in extractionResult) {
      return NextResponse.json(
        { error: extractionResult.message, code: extractionResult.code },
        { status: 422 }
      );
    }

    // Truncate content for LLM
    const truncatedContent = truncateUrlContent(extractionResult.content);

    // Get LLM provider
    const apiKey = decryptApiKey(settings.apiKey);
    const endpoint = settings.apiEndpoint || DEFAULT_ENDPOINTS[settings.provider as LLMProviderType];
    const provider = createProvider(
      settings.provider as LLMProviderType,
      endpoint,
      apiKey
    );

    // Build prompt - buildUrlPrompt takes 6 arguments
    const messages = buildUrlPrompt(
      truncatedContent,
      urlValue,
      extractionResult.title || undefined,
      questionCount,
      difficulty as DifficultyLevel,
      language
    );

    // Generate questions
    const response = await provider.complete({
      model: settings.detectedModel || "gpt-4o-mini",
      messages,
      maxTokens: 4000,
      temperature: 0.7,
    });

    // Parse response
    const parseResult = parseGenerationResponse(response.content);

    if (parseResult.questions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate valid questions from URL content" },
        { status: 422 }
      );
    }

    // Convert to GeneratedQuestion format with default time limit
    const questions = parseResult.questions.map((q) => ({
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

    return NextResponse.json({
      questions,
      tokenUsage: response.usage,
      warnings: warnings.length > 0 ? warnings : undefined,
      source: {
        type: "url",
        url: urlValue,
        title: extractionResult.title,
        wordCount: extractionResult.wordCount,
      },
    });
  } catch (error) {
    console.error("URL generation error:", error);

    if (error instanceof Error) {
      // Check for known LLM errors
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your settings." },
          { status: 401 }
        );
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate quiz from URL" },
      { status: 500 }
    );
  }
}
