import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import {
  jsonResponse,
  notFound,
  badRequest,
  parseJsonBody,
} from "@/lib/api/http";
import { UpdateQuizRequestSchema } from "@/lib/validation/schemas";
import { requireAuth } from "@/lib/auth/middleware";

interface QuestionDetail {
  id: string;
  prompt: string;
  timeLimitSeconds: number;
  media: { type: string; url: string } | null;
  options: { id: string; label: string; isCorrect: boolean }[];
}

interface QuizDetailResponse {
  id: string;
  title: string;
  description: string | null;
  questions: QuestionDetail[];
}

/**
 * GET /api/quizzes/[quizId]
 * Get quiz details with questions (requires authentication)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          answerOptions: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });

  if (!quiz) {
    return notFound("Quiz");
  }

  const response: QuizDetailResponse = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      timeLimitSeconds: q.timeLimitSeconds,
      media:
        q.mediaType && q.mediaUrl
          ? { type: q.mediaType, url: q.mediaUrl }
          : null,
      options: q.answerOptions.map((o) => ({
        id: o.id,
        label: o.label,
        isCorrect: o.isCorrect,
      })),
    })),
  };

  return jsonResponse(response);
}

/**
 * PUT /api/quizzes/[quizId]
 * Update a quiz (requires authentication)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { quizId } = await params;

  // Check quiz exists
  const existing = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true },
  });

  if (!existing) {
    return notFound("Quiz");
  }

  const parsed = await parseJsonBody(request, UpdateQuizRequestSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { title, description, questions } = parsed.data;

  try {
    // If questions are provided, replace all questions
    if (questions) {
      // Get existing question IDs
      const existingQuestions = await prisma.question.findMany({
        where: { quizId },
        select: { id: true },
      });
      const questionIds = existingQuestions.map((q) => q.id);

      // Delete responses first (they reference questions via answerOptions)
      await prisma.response.deleteMany({
        where: {
          selectedOption: {
            questionId: { in: questionIds },
          },
        },
      });

      // Delete answer options
      await prisma.answerOption.deleteMany({
        where: { questionId: { in: questionIds } },
      });

      // Delete existing questions
      await prisma.question.deleteMany({
        where: { quizId },
      });

      // Create new questions
      await prisma.quiz.update({
        where: { id: quizId },
        data: {
          title: title || undefined,
          description: description,
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
    } else {
      // Just update metadata
      await prisma.quiz.update({
        where: { id: quizId },
        data: {
          title: title || undefined,
          description: description,
        },
      });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    return jsonResponse({
      id: quiz!.id,
      title: quiz!.title,
      description: quiz!.description,
    });
  } catch (error) {
    console.error("Failed to update quiz:", error);
    return badRequest("Failed to update quiz");
  }
}

/**
 * DELETE /api/quizzes/[quizId]
 * Delete a quiz and all associated data (requires authentication)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { quizId } = await params;

  // Check quiz exists
  const existing = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true },
  });

  if (!existing) {
    return notFound("Quiz");
  }

  try {
    // First, delete all associated sessions and their data
    // Get all sessions for this quiz
    const sessions = await prisma.liveSession.findMany({
      where: { quizId },
      select: { id: true },
    });

    const sessionIds = sessions.map((s) => s.id);

    if (sessionIds.length > 0) {
      // Delete responses for all sessions
      await prisma.response.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });

      // Delete scores for all sessions
      await prisma.score.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });

      // Delete participants for all sessions
      await prisma.participant.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });

      // Delete all sessions
      await prisma.liveSession.deleteMany({
        where: { quizId },
      });
    }

    // Now delete the quiz (cascade will handle questions and answer options)
    await prisma.quiz.delete({
      where: { id: quizId },
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("Failed to delete quiz:", error);
    return badRequest("Failed to delete quiz. It may have active sessions.");
  }
}
