import { NextRequest } from "next/server";
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
  unauthorized,
  badRequest,
  notFound,
  parseJsonBody,
} from "@/lib/api/http";
import { HostControlRequestSchema } from "@/lib/validation/schemas";
import prisma from "@/lib/db/client";

const HOST_API_KEY = process.env.HOST_API_KEY;

interface HostControlResponse {
  ok: boolean;
}

/**
 * POST /api/sessions/[sessionId]/control
 * Host control endpoint (start/next/reveal/leaderboard/end)
 * Protected by HOST_API_KEY
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<Response> {
  const { sessionId } = await params;

  // Check API key (if configured)
  if (HOST_API_KEY) {
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== HOST_API_KEY) {
      return unauthorized("Invalid or missing API key");
    }
  }

  // Parse request
  const parsed = await parseJsonBody(request, HostControlRequestSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { action } = parsed.data;

  // Check session exists
  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  });

  if (!session) {
    return notFound("Session");
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
