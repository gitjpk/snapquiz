import { NextRequest } from "next/server";
import { submitAnswer } from "@/lib/sessions/sessionService";
import {
  jsonResponse,
  notFound,
  badRequest,
  sessionEnded,
  alreadyAnswered,
  parseJsonBody,
} from "@/lib/api/http";
import { SubmitAnswerRequestSchema } from "@/lib/validation/schemas";
import prisma from "@/lib/db/client";

interface SubmitAnswerResponse {
  accepted: boolean;
  isCorrect: boolean;
  points: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<Response> {
  const { sessionId } = await params;

  // Parse and validate request body
  const parsed = await parseJsonBody(request, SubmitAnswerRequestSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { participantId, questionId, selectedOptionId } = parsed.data;

  // Check session exists
  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  });

  if (!session) {
    return notFound("Session");
  }

  if (session.status === "ended") {
    return sessionEnded();
  }

  if (session.status !== "in_progress") {
    return badRequest("Session is not accepting answers");
  }

  try {
    const result = await submitAnswer(
      sessionId,
      participantId,
      questionId,
      selectedOptionId
    );

    const response: SubmitAnswerResponse = {
      accepted: result.accepted,
      isCorrect: result.isCorrect ?? false,
      points: result.points ?? 0,
    };

    return jsonResponse(response);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Already answered") {
        return alreadyAnswered();
      }
      if (error.message === "Session not found") {
        return notFound("Session");
      }
      if (error.message === "Question not found") {
        return notFound("Question");
      }
      if (error.message === "Invalid option selected") {
        return badRequest("Invalid option selected");
      }
      return badRequest(error.message);
    }
    throw error;
  }
}
