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
import { requireAuth, verifyOwnership, forbiddenResponse } from "@/lib/auth/middleware";

interface CreateSessionResponse {
  sessionId: string;
  pin: string;
  joinUrl: string;
}

/**
 * POST /api/sessions
 * Create a new live session from a quiz (requires authentication)
 * Quiz must be owned by the authenticated host
 * Reference: specs/005-multi-host-accounts/spec.md - FR-007 ownership check
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

  // Verify quiz exists and get ownership info
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, ownerHostId: true },
  });

  if (!quiz) {
    return notFound("Quiz");
  }

  // Verify ownership (FR-007: return 403 for unauthorized access)
  if (!await verifyOwnership(auth, quiz.ownerHostId)) {
    return forbiddenResponse();
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
