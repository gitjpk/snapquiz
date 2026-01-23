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
import { z } from "zod";
import prisma from "@/lib/db/client";

const DEMO_API_KEY = process.env.DEMO_API_KEY;

const DemoControlSchema = z.object({
  sessionId: z.string().min(1),
  action: z.enum([
    "start",
    "next",
    "close",
    "reveal",
    "leaderboard",
    "end",
  ]),
});

interface DemoControlResponse {
  ok: boolean;
  message: string;
}

/**
 * POST /api/dev/demo-control
 * Control a demo session (start, next question, reveal, etc.)
 * Protected by DEMO_API_KEY.
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Check API key
  const apiKey = request.headers.get("x-api-key");
  if (!DEMO_API_KEY || apiKey !== DEMO_API_KEY) {
    return unauthorized("Invalid or missing API key");
  }

  // Parse request
  const parsed = await parseJsonBody(request, DemoControlSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { sessionId, action } = parsed.data;

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
      case "start":
        await startGame(sessionId);
        return jsonResponse<DemoControlResponse>({
          ok: true,
          message: "Game started",
        });

      case "next":
        const hasNext = await nextQuestion(sessionId);
        return jsonResponse<DemoControlResponse>({
          ok: true,
          message: hasNext ? "Next question started" : "No more questions",
        });

      case "close":
        await closeQuestion(sessionId);
        return jsonResponse<DemoControlResponse>({
          ok: true,
          message: "Question closed",
        });

      case "reveal":
        await revealAnswer(sessionId);
        return jsonResponse<DemoControlResponse>({
          ok: true,
          message: "Answer revealed",
        });

      case "leaderboard":
        await showLeaderboard(sessionId);
        return jsonResponse<DemoControlResponse>({
          ok: true,
          message: "Leaderboard shown",
        });

      case "end":
        await endGame(sessionId);
        return jsonResponse<DemoControlResponse>({
          ok: true,
          message: "Game ended",
        });

      default:
        return badRequest("Unknown action");
    }
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message);
    }
    throw error;
  }
}
