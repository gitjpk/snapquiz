import { NextRequest, NextResponse } from "next/server";
import {
  startGame,
  nextQuestion,
  closeQuestion,
  revealAnswer,
  showLeaderboard,
  endGame,
} from "@/lib/sessions/sessionService";
import {
  jsonResponse,
  badRequest,
  notFound,
  parseJsonBody,
} from "@/lib/api/http";
import { HostControlRequestSchema } from "@/lib/validation/schemas";
import prisma from "@/lib/db/client";
import { requireAuth, verifyOwnership, forbiddenResponse } from "@/lib/auth/middleware";

interface HostControlResponse {
  ok: boolean;
}

/**
 * POST /api/sessions/[sessionId]/control
 * Host control endpoint (start/next/reveal/leaderboard/end)
 * Protected by session authentication
 * Session's quiz must be owned by the authenticated host
 * Reference: specs/005-multi-host-accounts/spec.md - FR-007 ownership check
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { sessionId } = await params;

  // Parse request
  const parsed = await parseJsonBody(request, HostControlRequestSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { action } = parsed.data;

  // Check session exists and get ownership info via quiz
  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    select: { 
      id: true, 
      status: true,
      quiz: {
        select: { ownerHostId: true }
      }
    },
  });

  if (!session) {
    return notFound("Session");
  }

  // Verify ownership via quiz (FR-007: return 403 for unauthorized access)
  if (!await verifyOwnership(auth, session.quiz.ownerHostId)) {
    return forbiddenResponse();
  }

  try {
    switch (action) {
      case "start_game":
        await startGame(sessionId);
        break;

      case "next_question":
        await nextQuestion(sessionId);
        break;

      case "reveal_answer":
        await closeQuestion(sessionId);
        await revealAnswer(sessionId);
        break;

      case "show_leaderboard":
        await showLeaderboard(sessionId);
        break;

      case "end_game":
        await endGame(sessionId);
        break;

      default:
        return badRequest("Unknown action");
    }

    const response: HostControlResponse = { ok: true };
    return jsonResponse(response);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message);
    }
    throw error;
  }
}
