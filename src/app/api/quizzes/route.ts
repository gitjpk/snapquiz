import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import {
  jsonResponse,
  badRequest,
  parseJsonBody,
} from "@/lib/api/http";
import { CreateQuizRequestSchema } from "@/lib/validation/schemas";
import { requireAuth } from "@/lib/auth/middleware";

interface QuizListItem {
  id: string;
  title: string;
  description: string | null;
  questionCount: number;
  createdAt: string;
}

interface QuizResponse {
  id: string;
  title: string;
  description: string | null;
}

/**
 * GET /api/quizzes
 * List all quizzes (requires authentication)
 */
export async function GET(): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { questions: true },
      },
    },
  });

  const response: QuizListItem[] = quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    questionCount: q._count.questions,
    createdAt: q.createdAt.toISOString(),
  }));

  return jsonResponse(response);
}

/**
 * POST /api/quizzes
 * Create a new quiz with questions (requires authentication)
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(request, CreateQuizRequestSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { title, description, questions } = parsed.data;

  try {
    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        questions: {
          create: questions.map((q, qIndex) => ({
            orderIndex: qIndex,
            prompt: q.prompt,
            timeLimitSeconds: q.timeLimitSeconds,
            mediaType: q.media?.type || null,
            mediaUrl: q.media?.url || null,
            answerOptions: {
              create: q.options.map((label, oIndex) => ({
                orderIndex: oIndex,
                label,
                isCorrect: oIndex === q.correctOptionIndex,
              })),
            },
          })),
        },
      },
    });

    const response: QuizResponse = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
    };

    return jsonResponse(response, 201);
  } catch (error) {
    console.error("Failed to create quiz:", error);
    return badRequest("Failed to create quiz");
  }
}
