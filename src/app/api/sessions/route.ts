import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/sessions/sessionService";
import {
  jsonResponse,
  badRequest,
  notFound,
  parseJsonBody,
} from "@/lib/api/http";
import { CreateSessionRequestSchema } from "@/lib/validation/schemas";
import prisma from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/middleware";

interface CreateSessionResponse {
  sessionId: string;
  pin: string;
  joinUrl: string;
}

/**
 * POST /api/sessions
 * Create a new live session from a quiz (requires authentication)
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(request, CreateSessionRequestSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { quizId, leaderboardTopN } = parsed.data;

  // Verify quiz exists
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true },
  });

  if (!quiz) {
    return notFound("Quiz");
  }

  try {
    const { sessionId, pin } = await createSession(quizId, leaderboardTopN);

    // Build join URL
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const joinUrl = `${protocol}://${host}/join?pin=${pin}`;

    const response: CreateSessionResponse = {
      sessionId,
      pin,
      joinUrl,
    };

    return jsonResponse(response, 201);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message);
    }
    throw error;
  }
}
